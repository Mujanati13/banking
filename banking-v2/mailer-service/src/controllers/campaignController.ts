import { Request, Response, NextFunction } from 'express';
import campaignService from '../services/campaignService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Validation schema for creating/updating campaigns
const campaignSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  subject: Joi.string().required().min(3).max(150),
  fromName: Joi.string().required().min(2).max(100),
  fromEmail: Joi.string().email().required(),
  domainId: Joi.string().required(),
  templateId: Joi.number().optional(),
  content: Joi.string().optional(),
  scheduledFor: Joi.string().isoDate().optional(),
  trackOpens: Joi.boolean().optional(),
  trackClicks: Joi.boolean().optional(),
  metadata: Joi.object().optional()
});

// Either templateId or content must be provided
const validateCampaignData = (data: any) => {
  // Must have either templateId or content
  if (!data.templateId && !data.content) {
    throw new ApiError(400, 'Either templateId or content must be provided');
  }
  
  return data;
};

/**
 * Campaign controller for handling campaign-related requests
 */
export const campaignController = {
  /**
   * Create a new campaign
   */
  createCampaign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = campaignSchema.validate(req.body);
      
      if (error) {
        throw new ApiError(400, `Validation error: ${error.message}`);
      }
      
      // Validate campaign data
      const campaignData = validateCampaignData(value);
      
      // Create campaign
      const campaign = await campaignService.createCampaign(campaignData);
      
      logger.info(`Campaign created: ${campaign.name}`, {
        userId: req.user?.id,
        campaignId: campaign.id
      });
      
      return res.status(201).json({
        success: true,
        campaign,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all campaigns
   */
  getAllCampaigns: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaigns = await campaignService.getAllCampaigns();
      
      return res.status(200).json({
        success: true,
        campaigns,
        count: campaigns.length,
        message: 'Campaigns retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get campaign by ID
   */
  getCampaignById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      const campaign = await campaignService.getCampaignById(Number(id));
      
      if (!campaign) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      return res.status(200).json({
        success: true,
        campaign,
        message: 'Campaign retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update campaign
   */
  updateCampaign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      // Validate only the fields that are provided
      const { error, value } = campaignSchema
        .fork(Object.keys(campaignSchema.describe().keys), (schema) => schema.optional())
        .validate(req.body);
      
      if (error) {
        throw new ApiError(400, `Validation error: ${error.message}`);
      }
      
      // Update campaign
      const campaign = await campaignService.updateCampaign(Number(id), value);
      
      if (!campaign) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      logger.info(`Campaign updated: ${campaign.name}`, {
        userId: req.user?.id,
        campaignId: campaign.id
      });
      
      return res.status(200).json({
        success: true,
        campaign,
        message: 'Campaign updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete campaign
   */
  deleteCampaign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      const deleted = await campaignService.deleteCampaign(Number(id));
      
      if (!deleted) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      logger.info(`Campaign deleted: ID ${id}`, {
        userId: req.user?.id
      });
      
      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Schedule campaign
   */
  scheduleCampaign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { scheduledFor } = req.body;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      if (!scheduledFor) {
        throw new ApiError(400, 'Scheduled date is required');
      }
      
      const campaign = await campaignService.scheduleCampaign(Number(id), scheduledFor);
      
      if (!campaign) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      logger.info(`Campaign scheduled: ${campaign.name} for ${scheduledFor}`, {
        userId: req.user?.id,
        campaignId: campaign.id
      });
      
      return res.status(200).json({
        success: true,
        campaign,
        message: 'Campaign scheduled successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Start campaign immediately
   */
  startCampaign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      const campaign = await campaignService.startCampaign(Number(id));
      
      if (!campaign) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      logger.info(`Campaign started: ${campaign.name}`, {
        userId: req.user?.id,
        campaignId: campaign.id
      });
      
      return res.status(200).json({
        success: true,
        campaign,
        message: 'Campaign started successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Pause campaign
   */
  pauseCampaign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      const campaign = await campaignService.pauseCampaign(Number(id));
      
      if (!campaign) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      logger.info(`Campaign paused: ${campaign.name}`, {
        userId: req.user?.id,
        campaignId: campaign.id
      });
      
      return res.status(200).json({
        success: true,
        campaign,
        message: 'Campaign paused successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get campaign status and metrics
   */
  getCampaignStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      const campaign = await campaignService.getCampaignById(Number(id));
      
      if (!campaign) {
        throw new ApiError(404, `Campaign with ID ${id} not found`);
      }
      
      const stats = await campaignService.getCampaignStats(Number(id));
      
      return res.status(200).json({
        success: true,
        status: campaign.status,
        campaign,
        stats,
        message: 'Campaign status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add recipients to campaign
   */
  addCampaignRecipients: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { recipients } = req.body;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new ApiError(400, 'Recipients array is required');
      }
      
      const result = await campaignService.addCampaignRecipients(Number(id), recipients);
      
      logger.info(`Added recipients to campaign ID ${id}`, {
        userId: req.user?.id,
        campaignId: id,
        added: result.added,
        duplicates: result.duplicates,
        invalid: result.invalid
      });
      
      return res.status(200).json({
        success: true,
        ...result,
        message: `Added ${result.added} recipients successfully`
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get campaign recipients
   */
  getCampaignRecipients: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        throw new ApiError(400, 'Valid campaign ID is required');
      }
      
      const recipients = await campaignService.getCampaignRecipients(Number(id));
      
      return res.status(200).json({
        success: true,
        recipients,
        count: recipients.length,
        message: 'Campaign recipients retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
