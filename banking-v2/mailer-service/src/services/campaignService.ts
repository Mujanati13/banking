import { logger } from '../utils/logger';
import {
  Campaign,
  CampaignDTO,
  CampaignStatus,
  CampaignStats,
  CampaignRecipient,
  RecipientStatus
} from '../models/Campaign';

// In-memory storage for campaigns (to be replaced with a database)
let campaigns: Campaign[] = [];
let recipients: CampaignRecipient[] = [];
let campaignStats: CampaignStats[] = [];
let nextCampaignId = 1;
let nextRecipientId = 1;

/**
 * Campaign service for managing email campaigns
 */
class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: CampaignDTO): Promise<Campaign> {
    try {
      const now = new Date().toISOString();
      
      const campaign: Campaign = {
        id: nextCampaignId++,
        ...campaignData,
        status: CampaignStatus.DRAFT,
        trackOpens: campaignData.trackOpens ?? true,
        trackClicks: campaignData.trackClicks ?? true,
        createdAt: now,
        updatedAt: now
      };
      
      // Store campaign
      campaigns.push(campaign);
      
      // Initialize campaign stats
      campaignStats.push({
        campaignId: campaign.id as number,
        sent: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        complained: 0,
        unsubscribed: 0,
        lastUpdated: now
      });
      
      logger.info(`Created new campaign: ${campaign.name} (ID: ${campaign.id})`);
      
      return campaign;
    } catch (error) {
      logger.error('Error creating campaign', { error });
      throw error;
    }
  }
  
  /**
   * Get all campaigns
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    return campaigns;
  }
  
  /**
   * Get campaign by ID
   */
  async getCampaignById(id: number): Promise<Campaign | null> {
    const campaign = campaigns.find(c => c.id === id);
    return campaign || null;
  }
  
  /**
   * Update campaign
   */
  async updateCampaign(id: number, campaignData: Partial<CampaignDTO>): Promise<Campaign | null> {
    try {
      const index = campaigns.findIndex(c => c.id === id);
      
      if (index === -1) {
        return null;
      }
      
      // Only allow updates to draft campaigns
      if (campaigns[index].status !== CampaignStatus.DRAFT && 
          campaigns[index].status !== CampaignStatus.SCHEDULED) {
        throw new Error(`Cannot update campaign with status: ${campaigns[index].status}`);
      }
      
      // Update campaign
      const updatedCampaign: Campaign = {
        ...campaigns[index],
        ...campaignData,
        updatedAt: new Date().toISOString()
      };
      
      campaigns[index] = updatedCampaign;
      
      logger.info(`Updated campaign: ${updatedCampaign.name} (ID: ${updatedCampaign.id})`);
      
      return updatedCampaign;
    } catch (error) {
      logger.error(`Error updating campaign ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Delete campaign
   */
  async deleteCampaign(id: number): Promise<boolean> {
    try {
      const index = campaigns.findIndex(c => c.id === id);
      
      if (index === -1) {
        return false;
      }
      
      // Only allow deletion of draft or completed campaigns
      if (campaigns[index].status !== CampaignStatus.DRAFT && 
          campaigns[index].status !== CampaignStatus.COMPLETED &&
          campaigns[index].status !== CampaignStatus.CANCELLED &&
          campaigns[index].status !== CampaignStatus.FAILED) {
        throw new Error(`Cannot delete campaign with status: ${campaigns[index].status}`);
      }
      
      // Remove campaign
      campaigns.splice(index, 1);
      
      // Remove associated recipients
      recipients = recipients.filter(r => r.campaignId !== id);
      
      // Remove associated stats
      const statsIndex = campaignStats.findIndex(s => s.campaignId === id);
      if (statsIndex !== -1) {
        campaignStats.splice(statsIndex, 1);
      }
      
      logger.info(`Deleted campaign with ID: ${id}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting campaign ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Schedule campaign
   */
  async scheduleCampaign(id: number, scheduledFor: string): Promise<Campaign | null> {
    try {
      const campaign = await this.getCampaignById(id);
      
      if (!campaign) {
        return null;
      }
      
      // Only allow scheduling of draft campaigns
      if (campaign.status !== CampaignStatus.DRAFT) {
        throw new Error(`Cannot schedule campaign with status: ${campaign.status}`);
      }
      
      // Validate scheduled date
      const scheduledDate = new Date(scheduledFor);
      const now = new Date();
      
      if (scheduledDate <= now) {
        throw new Error('Scheduled date must be in the future');
      }
      
      // Update campaign
      return this.updateCampaign(id, {
        scheduledFor,
        ...{ status: CampaignStatus.SCHEDULED }
      } as any);
    } catch (error) {
      logger.error(`Error scheduling campaign ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Start campaign immediately
   */
  async startCampaign(id: number): Promise<Campaign | null> {
    try {
      const campaign = await this.getCampaignById(id);
      
      if (!campaign) {
        return null;
      }
      
      // Only allow starting of draft or scheduled campaigns
      if (campaign.status !== CampaignStatus.DRAFT && 
          campaign.status !== CampaignStatus.SCHEDULED) {
        throw new Error(`Cannot start campaign with status: ${campaign.status}`);
      }
      
      // TODO: Implement actual sending logic
      // For now, just update the status
      return this.updateCampaign(id, {
        ...{ status: CampaignStatus.PROCESSING }
      } as any);
    } catch (error) {
      logger.error(`Error starting campaign ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Pause campaign
   */
  async pauseCampaign(id: number): Promise<Campaign | null> {
    try {
      const campaign = await this.getCampaignById(id);
      
      if (!campaign) {
        return null;
      }
      
      // Only allow pausing of processing or sending campaigns
      if (campaign.status !== CampaignStatus.PROCESSING && 
          campaign.status !== CampaignStatus.SENDING) {
        throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
      }
      
      // TODO: Implement actual pausing logic
      
      // Update campaign
      return this.updateCampaign(id, {
        ...{ status: CampaignStatus.PAUSED }
      } as any);
    } catch (error) {
      logger.error(`Error pausing campaign ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Get campaign stats
   */
  async getCampaignStats(id: number): Promise<CampaignStats | null> {
    const stats = campaignStats.find(s => s.campaignId === id);
    return stats || null;
  }
  
  /**
   * Get campaign recipients
   */
  async getCampaignRecipients(id: number): Promise<CampaignRecipient[]> {
    return recipients.filter(r => r.campaignId === id);
  }
  
  /**
   * Add recipients to campaign
   */
  async addCampaignRecipients(
    id: number, 
    emailList: Array<{ email: string; firstName?: string; lastName?: string; metadata?: Record<string, any> }>
  ): Promise<{ added: number; duplicates: number; invalid: number; total: number }> {
    try {
      const campaign = await this.getCampaignById(id);
      
      if (!campaign) {
        throw new Error(`Campaign with ID ${id} not found`);
      }
      
      // Only allow adding recipients to draft or scheduled campaigns
      if (campaign.status !== CampaignStatus.DRAFT && 
          campaign.status !== CampaignStatus.SCHEDULED) {
        throw new Error(`Cannot add recipients to campaign with status: ${campaign.status}`);
      }
      
      let added = 0;
      let duplicates = 0;
      let invalid = 0;
      
      // Process each email
      for (const entry of emailList) {
        // Basic email validation
        if (!this.isValidEmail(entry.email)) {
          invalid++;
          continue;
        }
        
        // Check for duplicates
        const isDuplicate = recipients.some(
          r => r.campaignId === id && r.email.toLowerCase() === entry.email.toLowerCase()
        );
        
        if (isDuplicate) {
          duplicates++;
          continue;
        }
        
        // Add recipient
        recipients.push({
          id: nextRecipientId++,
          campaignId: id,
          email: entry.email,
          firstName: entry.firstName,
          lastName: entry.lastName,
          status: RecipientStatus.PENDING,
          metadata: entry.metadata
        });
        
        added++;
      }
      
      // Update campaign recipient count
      const campaignIndex = campaigns.findIndex(c => c.id === id);
      if (campaignIndex !== -1) {
        campaigns[campaignIndex].recipientCount = (campaigns[campaignIndex].recipientCount || 0) + added;
        campaigns[campaignIndex].updatedAt = new Date().toISOString();
      }
      
      logger.info(`Added ${added} recipients to campaign ID ${id}`);
      
      return {
        added,
        duplicates,
        invalid,
        total: emailList.length
      };
    } catch (error) {
      logger.error(`Error adding recipients to campaign ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Record email open event
   */
  async recordOpenEvent(campaignId: number, recipientId: number): Promise<boolean> {
    try {
      // Find the recipient
      const recipientIndex = recipients.findIndex(
        r => r.campaignId === campaignId && r.id === recipientId
      );
      
      if (recipientIndex === -1) {
        logger.warn(`Recipient ${recipientId} not found for campaign ${campaignId}`);
        return false;
      }
      
      // Update recipient status if it's not already opened or clicked
      if (recipients[recipientIndex].status !== RecipientStatus.OPENED &&
          recipients[recipientIndex].status !== RecipientStatus.CLICKED) {
        recipients[recipientIndex].status = RecipientStatus.OPENED;
        recipients[recipientIndex].openedAt = new Date().toISOString();
      }
      
      // Update campaign stats
      const statsIndex = campaignStats.findIndex(s => s.campaignId === campaignId);
      if (statsIndex !== -1) {
        // Only increment if this is the first open for this recipient
        if (!recipients[recipientIndex].openedAt) {
          campaignStats[statsIndex].opened++;
          campaignStats[statsIndex].lastUpdated = new Date().toISOString();
        }
      }
      
      logger.debug(`Recorded open event: Campaign ${campaignId}, Recipient ${recipientId}`);
      return true;
    } catch (error) {
      logger.error(`Error recording open event for campaign ${campaignId}, recipient ${recipientId}`, { error });
      return false;
    }
  }

  /**
   * Record email click event
   */
  async recordClickEvent(campaignId: number, recipientId: number, url: string): Promise<boolean> {
    try {
      // Find the recipient
      const recipientIndex = recipients.findIndex(
        r => r.campaignId === campaignId && r.id === recipientId
      );
      
      if (recipientIndex === -1) {
        logger.warn(`Recipient ${recipientId} not found for campaign ${campaignId}`);
        return false;
      }
      
      // Update recipient status
      recipients[recipientIndex].status = RecipientStatus.CLICKED;
      recipients[recipientIndex].clickedAt = new Date().toISOString();
      
      // If there was no previous open event, record one now
      if (!recipients[recipientIndex].openedAt) {
        recipients[recipientIndex].openedAt = new Date().toISOString();
      }
      
      // Store click data in metadata
      if (!recipients[recipientIndex].metadata) {
        recipients[recipientIndex].metadata = {};
      }
      
      if (!recipients[recipientIndex].metadata.clicks) {
        recipients[recipientIndex].metadata.clicks = [];
      }
      
      // Add this click to the list
      recipients[recipientIndex].metadata.clicks.push({
        url,
        timestamp: new Date().toISOString()
      });
      
      // Update campaign stats
      const statsIndex = campaignStats.findIndex(s => s.campaignId === campaignId);
      if (statsIndex !== -1) {
        // Only increment opened if this is the first open for this recipient
        if (!recipients[recipientIndex].openedAt) {
          campaignStats[statsIndex].opened++;
        }
        
        // Only increment clicked if this is the first click for this recipient
        if (recipients[recipientIndex].metadata.clicks.length === 1) {
          campaignStats[statsIndex].clicked++;
        }
        
        campaignStats[statsIndex].lastUpdated = new Date().toISOString();
      }
      
      logger.debug(`Recorded click event: Campaign ${campaignId}, Recipient ${recipientId}, URL: ${url}`);
      return true;
    } catch (error) {
      logger.error(`Error recording click event for campaign ${campaignId}, recipient ${recipientId}`, { error });
      return false;
    }
  }

  /**
   * Record unsubscribe event
   */
  async recordUnsubscribeEvent(campaignId: number, recipientId: number): Promise<boolean> {
    try {
      // Find the recipient
      const recipientIndex = recipients.findIndex(
        r => r.campaignId === campaignId && r.id === recipientId
      );
      
      if (recipientIndex === -1) {
        logger.warn(`Recipient ${recipientId} not found for campaign ${campaignId}`);
        return false;
      }
      
      // Update recipient status
      recipients[recipientIndex].status = RecipientStatus.UNSUBSCRIBED;
      recipients[recipientIndex].unsubscribedAt = new Date().toISOString();
      
      // Update campaign stats
      const statsIndex = campaignStats.findIndex(s => s.campaignId === campaignId);
      if (statsIndex !== -1) {
        campaignStats[statsIndex].unsubscribed++;
        campaignStats[statsIndex].lastUpdated = new Date().toISOString();
      }
      
      logger.debug(`Recorded unsubscribe event: Campaign ${campaignId}, Recipient ${recipientId}`);
      return true;
    } catch (error) {
      logger.error(`Error recording unsubscribe event for campaign ${campaignId}, recipient ${recipientId}`, { error });
      return false;
    }
  }
}

export default new CampaignService();
