import { Resend } from 'resend';
import getResendClient from '../config/resend';
import { logger } from '../utils/logger';
import { CampaignRecipient, RecipientStatus } from '../models/Campaign';

/**
 * Email data interface
 */
export interface EmailData {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
  tags?: string[];
  headers?: Record<string, string>;
}

/**
 * Batch send result interface
 */
export interface BatchSendResult {
  successful: number;
  failed: number;
  total: number;
  failures: Array<{
    recipient: string;
    error: string;
  }>;
  batchId: string;
}

/**
 * Service for sending emails through Resend
 */
class EmailService {
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly DEFAULT_RATE_LIMIT = 10; // emails per second
  
  /**
   * Send a single email
   */
  async sendEmail(emailData: EmailData): Promise<{ id: string } | null> {
    try {
      const resend = getResendClient();
      
      if (!resend) {
        throw new Error('Resend client not initialized');
      }
      
      const { from, fromName, to, subject, html, text, ...rest } = emailData;
      
      const fromAddress = fromName ? `${fromName} <${from}>` : from;
      
      logger.debug('Sending email', {
        to,
        subject,
        fromAddress
      });
      
      const data = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
        text: text || this.generateTextVersion(html),
        headers: rest.headers,
        tags: rest.tags ? rest.tags.map(tag => ({ name: tag, value: tag })) : undefined,
        cc: rest.cc,
        bcc: rest.bcc,
        reply_to: rest.replyTo,
        attachments: rest.attachments
      });
      
      logger.info('Email sent successfully', {
        id: data.data?.id,
        to,
        subject
      });
      
      return { id: data.data?.id || '' };
    } catch (error) {
      logger.error('Error sending email', { error, to: emailData.to, subject: emailData.subject });
      throw error;
    }
  }
  
  /**
   * Send emails in batches with rate limiting
   */
  async sendBatch(
    emails: EmailData[],
    options: {
      batchSize?: number;
      rateLimit?: number; // emails per second
      onProgress?: (progress: { sent: number; total: number; percentage: number }) => void;
    } = {}
  ): Promise<BatchSendResult> {
    try {
      const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
      const rateLimit = options.rateLimit || this.DEFAULT_RATE_LIMIT;
      const delayBetweenEmails = Math.floor(1000 / rateLimit);
      
      logger.info(`Starting batch send of ${emails.length} emails`, {
        batchSize,
        rateLimit: `${rateLimit} emails/second`,
        delayBetweenEmails: `${delayBetweenEmails}ms`
      });
      
      let successful = 0;
      let failed = 0;
      const failures: Array<{ recipient: string; error: string }> = [];
      const batchId = `batch-${new Date().getTime()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Process emails in batches
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`, {
          batchSize: batch.length,
          batchId
        });
        
        // Process each email in the batch with rate limiting
        const promises = batch.map((email, index) => {
          return new Promise<void>((resolve) => {
            setTimeout(async () => {
              try {
                await this.sendEmail(email);
                successful++;
              } catch (error) {
                failed++;
                failures.push({
                  recipient: email.to,
                  error: error instanceof Error ? error.message : String(error)
                });
              } finally {
                // Call progress callback if provided
                if (options.onProgress) {
                  const sent = successful + failed;
                  options.onProgress({
                    sent,
                    total: emails.length,
                    percentage: Math.round((sent / emails.length) * 100)
                  });
                }
                
                resolve();
              }
            }, index * delayBetweenEmails);
          });
        });
        
        // Wait for all emails in this batch to be processed
        await Promise.all(promises);
        
        // Add a small delay between batches to avoid overwhelming the API
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const result: BatchSendResult = {
        successful,
        failed,
        total: emails.length,
        failures,
        batchId
      };
      
      logger.info(`Batch send complete: ${successful}/${emails.length} successful`, {
        batchId,
        successful,
        failed
      });
      
      return result;
    } catch (error) {
      logger.error('Error in batch send', { error });
      throw error;
    }
  }
  
  /**
   * Process a campaign batch
   */
  async processCampaignBatch(
    campaignId: number,
    recipients: CampaignRecipient[],
    emailTemplate: {
      fromEmail: string;
      fromName: string;
      subject: string;
      html: string;
    },
    options: {
      batchSize?: number;
      rateLimit?: number;
      trackOpens?: boolean;
      trackClicks?: boolean;
    } = {}
  ): Promise<BatchSendResult> {
    try {
      // Map recipients to email data
      const emails: EmailData[] = recipients.map(recipient => {
        // Apply basic personalization
        // Apply basic personalization
        let personalizedHtml = this.personalizeTemplate(emailTemplate.html, {
          email: recipient.email,
          firstName: recipient.firstName || '',
          lastName: recipient.lastName || '',
          fullName: this.getFullName(recipient),
          ...recipient.metadata
        });
        
        // Add tracking pixels for open tracking if enabled
        if (options.trackOpens) {
          const trackingPixel = `<img src="${process.env.TRACKING_URL || 'http://localhost:3002'}/api/track/open?cid=${campaignId}&rid=${recipient.id}" width="1" height="1" alt="" style="display:none;" />`;          
          personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`);
          if (!personalizedHtml.includes('</body>')) {
            personalizedHtml += trackingPixel;
          }
        }
        
        // Add click tracking if enabled
        if (options.trackClicks) {
          personalizedHtml = this.addClickTracking(personalizedHtml, campaignId, recipient.id || 0);
        }
        
        const personalizedSubject = this.personalizeTemplate(emailTemplate.subject, {
          firstName: recipient.firstName || '',
          lastName: recipient.lastName || '',
          fullName: this.getFullName(recipient),
          ...recipient.metadata
        });
        
        return {
          from: emailTemplate.fromEmail,
          fromName: emailTemplate.fromName,
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          tags: [`campaign-${campaignId}`],
          headers: {
            'X-Campaign-ID': String(campaignId),
            'X-Recipient-ID': String(recipient.id)
          }
        };
      });
      
      // Send batch
      return await this.sendBatch(emails, options);
    } catch (error) {
      logger.error(`Error processing campaign batch for campaign ${campaignId}`, { error });
      throw error;
    }
  }
  
  /**
   * Generate a text version from HTML content
   */
  private generateTextVersion(html: string): string {
    // Very basic HTML to text conversion
    // In a production app, you might want to use a dedicated library like html-to-text
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  
  /**
   * Personalize a template with recipient data
   */
  private personalizeTemplate(
    template: string,
    data: Record<string, string | number | boolean | undefined>
  ): string {
    let result = template;
    
    // Replace {{variable}} placeholders with actual values
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value !== undefined ? String(value) : '');
    });
    
    return result;
  }
  
  /**
   * Get full name from recipient first and last name
   */
  private getFullName(recipient: { firstName?: string; lastName?: string }): string {
    const parts = [];
    if (recipient.firstName) parts.push(recipient.firstName);
    if (recipient.lastName) parts.push(recipient.lastName);
    return parts.length > 0 ? parts.join(' ') : '';
  }

  /**
   * Add click tracking to HTML content by replacing links with tracking URLs
   */
  private addClickTracking(html: string, campaignId: number, recipientId: number): string {
    const trackingBaseUrl = process.env.TRACKING_URL || 'http://localhost:3002';
    
    // Regular expression to find links in HTML
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=([\"'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
    
    // Replace links with tracking links
    return html.replace(linkRegex, (match, quote, url, text) => {
      // Skip tracking for anchor links, mailto links, etc.
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }
      
      // Create tracking URL
      const encodedUrl = encodeURIComponent(url);
      const trackingUrl = `${trackingBaseUrl}/api/track/click?cid=${campaignId}&rid=${recipientId}&url=${encodedUrl}`;
      
      // Replace the original URL with the tracking URL
      return match.replace(url, trackingUrl);
    });
  }
}

export default new EmailService();
