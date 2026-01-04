import { logger } from '../utils/logger';
import campaignService from './campaignService';
import emailService from './emailService';
import { Campaign, CampaignStatus, RecipientStatus } from '../models/Campaign';

/**
 * Campaign executor service for processing and sending campaigns
 */
class CampaignExecutorService {
  // Keep track of running campaigns to prevent duplicate executions
  private runningCampaigns = new Set<number>();
  
  /**
   * Process scheduled campaigns
   * This should be called periodically to check for campaigns that need to be sent
   */
  async processScheduledCampaigns(): Promise<{ processed: number; started: number }> {
    try {
      let processed = 0;
      let started = 0;
      
      // Get all scheduled campaigns
      const campaigns = await campaignService.getAllCampaigns();
      const scheduledCampaigns = campaigns.filter(
        campaign => campaign.status === CampaignStatus.SCHEDULED
      );
      
      logger.info(`Processing ${scheduledCampaigns.length} scheduled campaigns`);
      
      // Check which campaigns need to be started
      const now = new Date();
      
      for (const campaign of scheduledCampaigns) {
        processed++;
        
        if (!campaign.scheduledFor) {
          continue;
        }
        
        const scheduledDate = new Date(campaign.scheduledFor);
        
        // If scheduled time has passed and campaign is not already running
        if (scheduledDate <= now && !this.runningCampaigns.has(campaign.id as number)) {
          // Start campaign
          logger.info(`Starting scheduled campaign: ${campaign.name} (ID: ${campaign.id})`);
          await this.executeCampaign(campaign.id as number);
          started++;
        }
      }
      
      return { processed, started };
    } catch (error) {
      logger.error('Error processing scheduled campaigns', { error });
      throw error;
    }
  }
  
  /**
   * Execute a campaign
   */
  async executeCampaign(campaignId: number): Promise<boolean> {
    // Prevent duplicate execution
    if (this.runningCampaigns.has(campaignId)) {
      logger.warn(`Campaign ${campaignId} is already running`);
      return false;
    }
    
    try {
      this.runningCampaigns.add(campaignId);
      
      // Get campaign
      const campaign = await campaignService.getCampaignById(campaignId);
      
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      
      // Update campaign status to processing
      await campaignService.updateCampaign(campaignId, {
        ...{ status: CampaignStatus.PROCESSING }
      } as any);
      
      // Get recipients
      const recipients = await campaignService.getCampaignRecipients(campaignId);
      
      if (recipients.length === 0) {
        logger.warn(`Campaign ${campaignId} has no recipients`);
        
        // Update campaign status to completed (with warning)
        await campaignService.updateCampaign(campaignId, {
          ...{ status: CampaignStatus.COMPLETED }
        } as any);
        
        return true;
      }
      
      logger.info(`Executing campaign ${campaignId} with ${recipients.length} recipients`);
      
      // Update campaign status to sending
      await campaignService.updateCampaign(campaignId, {
        ...{ status: CampaignStatus.SENDING }
      } as any);
      
      // Get content from template or direct content
      let html = campaign.content || '';
      let subject = campaign.subject;
      
      // If using a template, fetch it from the template service
      if (campaign.templateId) {
        try {
          const response = await fetch(`${process.env.MAIN_API_URL || 'http://localhost:3001'}/api/email-templates/${campaign.templateId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.API_KEY || ''}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.template) {
              html = data.template.html_content;
              // Use campaign subject or template subject as fallback
              subject = campaign.subject || data.template.subject;
              logger.info(`Using template ${data.template.name} for campaign ${campaignId}`);
            }
          } else {
            logger.warn(`Failed to fetch template ${campaign.templateId} for campaign ${campaignId}`);
          }
        } catch (error) {
          logger.error(`Error fetching template ${campaign.templateId} for campaign ${campaignId}`, { error });
          // Continue with campaign using direct content if available
        }
      }
      
      // If we still don't have content, fail the campaign
      if (!html) {
        logger.error(`Campaign ${campaignId} has no content`);
        
        // Update campaign status to failed
        await campaignService.updateCampaign(campaignId, {
          ...{ status: CampaignStatus.FAILED }
        } as any);
        
        return false;
      }
      
      // Process campaign in batches
      const result = await emailService.processCampaignBatch(
        campaignId,
        recipients,
        {
          fromEmail: campaign.fromEmail,
          fromName: campaign.fromName,
          subject,
          html
        },
        {
          batchSize: 100,
          rateLimit: 10,
          trackOpens: campaign.trackOpens,
          trackClicks: campaign.trackClicks
        }
      );
      
      logger.info(`Campaign ${campaignId} execution completed`, {
        successful: result.successful,
        failed: result.failed,
        total: result.total
      });
      
      // Update campaign status to completed
      await campaignService.updateCampaign(campaignId, {
        ...{ status: CampaignStatus.COMPLETED }
      } as any);
      
      return true;
    } catch (error) {
      logger.error(`Error executing campaign ${campaignId}`, { error });
      
      // Update campaign status to failed
      await campaignService.updateCampaign(campaignId, {
        ...{ status: CampaignStatus.FAILED }
      } as any);
      
      return false;
    } finally {
      this.runningCampaigns.delete(campaignId);
    }
  }
  
  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId: number): Promise<boolean> {
    try {
      if (!this.runningCampaigns.has(campaignId)) {
        logger.warn(`Campaign ${campaignId} is not running`);
        return false;
      }
      
      // TODO: Implement pause logic - this might require more sophisticated queue management
      
      // For now, just update the status
      await campaignService.updateCampaign(campaignId, {
        ...{ status: CampaignStatus.PAUSED }
      } as any);
      
      logger.info(`Paused campaign ${campaignId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error pausing campaign ${campaignId}`, { error });
      return false;
    }
  }
  
  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: number): Promise<boolean> {
    try {
      const campaign = await campaignService.getCampaignById(campaignId);
      
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      
      if (campaign.status !== CampaignStatus.PAUSED) {
        logger.warn(`Cannot resume campaign ${campaignId} with status ${campaign.status}`);
        return false;
      }
      
      // Update campaign status back to sending
      await campaignService.updateCampaign(campaignId, {
        ...{ status: CampaignStatus.SENDING }
      } as any);
      
      // Re-execute campaign
      return await this.executeCampaign(campaignId);
    } catch (error) {
      logger.error(`Error resuming campaign ${campaignId}`, { error });
      return false;
    }
  }
  
  /**
   * Schedule periodic jobs to process campaigns
   * This should be called once when the application starts
   */
  startScheduler(intervalMinutes = 5): NodeJS.Timeout {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    logger.info(`Starting campaign scheduler with ${intervalMinutes} minute interval`);
    
    // Process immediately on startup
    this.processScheduledCampaigns().catch(error => {
      logger.error('Error in initial campaign processing', { error });
    });
    
    // Return the interval so it can be cleared if needed
    return setInterval(() => {
      this.processScheduledCampaigns().catch(error => {
        logger.error('Error in scheduled campaign processing', { error });
      });
    }, intervalMs);
  }
}

export default new CampaignExecutorService();
