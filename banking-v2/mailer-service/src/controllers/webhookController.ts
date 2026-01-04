import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';
import { CampaignRecipient, RecipientStatus } from '../models/Campaign';
import campaignService from '../services/campaignService';

// In a real implementation, you would store and update these stats in a database
// For now, we'll use an in-memory store for demonstration
interface WebhookEvents {
  delivered: Map<string, Date>;
  opened: Map<string, Date>;
  clicked: Map<string, Set<string>>;
  complained: Map<string, Date>;
  bounced: Map<string, { type: string; diagnostic: string; date: Date }>;
}

// Store events by recipient email
const webhookEvents: WebhookEvents = {
  delivered: new Map(),
  opened: new Map(),
  clicked: new Map(),
  complained: new Map(),
  bounced: new Map()
};

/**
 * Controller for handling Resend webhook events
 */
export const webhookController = {
  /**
   * Verify Resend webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');
      
      // Use timing-safe comparison to prevent timing attacks
      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error verifying webhook signature', { error });
      return false;
    }
  },
  
  /**
   * Handle webhook events from Resend
   * Documentation: https://resend.com/docs/webhooks
   */
  handleWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get webhook signature and timestamp headers
      const signature = req.headers['resend-signature'] as string;
      const timestamp = req.headers['resend-timestamp'] as string;
      
      if (!signature || !timestamp) {
        throw new ApiError(400, 'Missing signature or timestamp headers');
      }
      
      // Verify webhook signature if webhook secret is set
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        const payload = JSON.stringify(req.body);
        const isValid = webhookController.verifyWebhookSignature(
          payload,
          signature,
          timestamp,
          webhookSecret
        );
        
        if (!isValid) {
          throw new ApiError(401, 'Invalid webhook signature');
        }
      } else {
        logger.warn('RESEND_WEBHOOK_SECRET is not set. Skipping webhook signature verification.');
      }
      
      // Process webhook event
      const { type, data } = req.body;
      
      // We need at least these fields to process the event
      if (!type || !data || !data.email) {
        throw new ApiError(400, 'Invalid webhook data');
      }
      
      // Log webhook event
      logger.info(`Received webhook event: ${type}`, {
        email: data.email,
        timestamp: new Date().toISOString()
      });
      
      // Track event in memory (in production, you would update your database)
      webhookController.trackEvent(type, data);
      
      // Process event based on type
      await webhookController.processEvent(type, data);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: `Processed ${type} event`
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Process webhook event by type
   */
  async processEvent(type: string, data: any): Promise<void> {
    try {
      // Extract campaign and recipient IDs from email headers if available
      const campaignId = data.headers?.['X-Campaign-ID'];
      const recipientId = data.headers?.['X-Recipient-ID'];
      
      if (!campaignId || !recipientId) {
        logger.debug('Event not associated with campaign', { type, email: data.email });
        return;
      }
      
      // Get recipient
      const recipients = await campaignService.getCampaignRecipients(Number(campaignId));
      const recipient = recipients.find(r => r.id === Number(recipientId));
      
      if (!recipient) {
        logger.warn(`Recipient ${recipientId} not found for campaign ${campaignId}`, {
          type,
          email: data.email
        });
        return;
      }
      
      // Update recipient status based on event type
      let status: RecipientStatus | undefined;
      let updateData: Partial<CampaignRecipient> = {};
      
      switch (type) {
        case 'email.delivered':
          status = RecipientStatus.DELIVERED;
          updateData.sentAt = new Date().toISOString();
          break;
        
        case 'email.delivery_delayed':
          // No status change, just log
          break;
        
        case 'email.opened':
          status = RecipientStatus.OPENED;
          updateData.openedAt = new Date().toISOString();
          break;
        
        case 'email.clicked':
          status = RecipientStatus.CLICKED;
          updateData.clickedAt = new Date().toISOString();
          break;
        
        case 'email.complained':
          status = RecipientStatus.COMPLAINED;
          break;
        
        case 'email.bounced':
          status = RecipientStatus.BOUNCED;
          break;
        
        case 'email.unsubscribed':
          status = RecipientStatus.UNSUBSCRIBED;
          break;
        
        default:
          logger.warn(`Unknown event type: ${type}`);
          return;
      }
      
      if (status) {
        // TODO: In a production app, you would update the recipient in the database
        // For now, we'll just log the update
        logger.info(`Updating recipient ${recipientId} status to ${status}`, {
          campaignId,
          email: data.email,
          previousStatus: recipient.status
        });
      }
    } catch (error) {
      logger.error('Error processing webhook event', { error, type, email: data?.email });
    }
  },
  
  /**
   * Track webhook event in memory
   */
  trackEvent(type: string, data: any): void {
    const email = data.email.toLowerCase();
    const now = new Date();
    
    switch (type) {
      case 'email.delivered':
        webhookEvents.delivered.set(email, now);
        break;
      
      case 'email.opened':
        webhookEvents.opened.set(email, now);
        break;
      
      case 'email.clicked':
        if (!webhookEvents.clicked.has(email)) {
          webhookEvents.clicked.set(email, new Set());
        }
        // Track which link was clicked if available
        if (data.url) {
          webhookEvents.clicked.get(email)?.add(data.url);
        }
        break;
      
      case 'email.complained':
        webhookEvents.complained.set(email, now);
        break;
      
      case 'email.bounced':
        webhookEvents.bounced.set(email, {
          type: data.bounce_type || 'unknown',
          diagnostic: data.bounce_diagnostic || '',
          date: now
        });
        break;
    }
  },
  
  /**
   * Get tracked events for debugging/testing
   */
  getTrackedEvents: (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert map values to arrays for JSON serialization
      const delivered = Array.from(webhookEvents.delivered).map(([email, date]) => ({
        email,
        date: date.toISOString()
      }));
      
      const opened = Array.from(webhookEvents.opened).map(([email, date]) => ({
        email,
        date: date.toISOString()
      }));
      
      const clicked = Array.from(webhookEvents.clicked).map(([email, urls]) => ({
        email,
        urls: Array.from(urls)
      }));
      
      const complained = Array.from(webhookEvents.complained).map(([email, date]) => ({
        email,
        date: date.toISOString()
      }));
      
      const bounced = Array.from(webhookEvents.bounced).map(([email, info]) => ({
        email,
        type: info.type,
        diagnostic: info.diagnostic,
        date: info.date.toISOString()
      }));
      
      return res.status(200).json({
        success: true,
        events: {
          delivered,
          opened,
          clicked,
          complained,
          bounced
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
