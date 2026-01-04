import { Request, Response, NextFunction } from 'express';
import domainService from '../services/domainService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Domain controller for handling domain-related requests
 */
export const domainController = {
  /**
   * Get all domains
   */
  getAllDomains: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const result = await domainService.getAllDomains(forceRefresh);
      
      return res.status(200).json({
        success: true,
        ...result,
        message: result.cached ? 'Domains retrieved from cache' : 'Domains retrieved from Resend API'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get domain by ID
   */
  getDomainById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const forceRefresh = req.query.refresh === 'true';
      
      if (!id) {
        throw new ApiError(400, 'Domain ID is required');
      }
      
      const domain = await domainService.getDomainById(id, forceRefresh);
      
      return res.status(200).json({
        success: true,
        domain,
        message: 'Domain details retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Force refresh domain cache
   */
  refreshDomains: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Manual refresh of domain cache requested', { 
        user: req.user?.username,
        ip: req.ip
      });
      
      const result = await domainService.refreshCache();
      
      return res.status(200).json({
        success: true,
        ...result,
        message: 'Domain cache refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get domain metrics
   */
  getDomainMetrics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new ApiError(400, 'Domain ID is required');
      }
      
      const metrics = await domainService.getDomainMetrics(id);
      
      return res.status(200).json({
        success: true,
        metrics,
        message: 'Domain metrics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get domain cache status
   */
  getCacheStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lastSyncTime = domainService.getLastSyncTime();
      
      return res.status(200).json({
        success: true,
        cacheStatus: {
          lastSyncTime,
          age: lastSyncTime ? new Date().getTime() - lastSyncTime.getTime() : null,
          ageInMinutes: lastSyncTime ? (new Date().getTime() - lastSyncTime.getTime()) / 60000 : null
        },
        message: 'Cache status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
