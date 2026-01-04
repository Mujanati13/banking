import NodeCache from 'node-cache';
import getResendClient from '../config/resend';
import { logger } from '../utils/logger';

// Define domain type
export interface Domain {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'failed' | 'temporary_failure' | 'unverified';
  created_at: string;
  region: string;
  dkim_status?: 'pending' | 'verified' | 'failed';
  records?: Array<{
    name: string;
    type: string;
    value: string;
    status: 'verified' | 'pending' | 'failed';
  }>;
}

// Create cache with 1-hour TTL default
const domainCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // Check for expired items every 10 minutes
});

// Keep track of last sync time
let lastSyncTime: Date | null = null;

/**
 * Domain service for interacting with Resend domains
 */
class DomainService {
  private readonly CACHE_KEY = 'resend_domains';
  
  /**
   * Get all domains from Resend API or cache
   */
  async getAllDomains(forceRefresh = false): Promise<{ 
    domains: Domain[]; 
    cached: boolean; 
    lastSyncTime: Date | null;
    error?: string;
  }> {
    try {
      // Return cached domains if available and not forcing refresh
      if (!forceRefresh && domainCache.has(this.CACHE_KEY)) {
        logger.debug('Returning domains from cache');
        const cachedDomains = domainCache.get<Domain[]>(this.CACHE_KEY) || [];
        return { domains: cachedDomains, cached: true, lastSyncTime };
      }
      
      // Get domains from Resend API
      const resend = getResendClient();
      if (!resend) {
        throw new Error('Resend client not initialized');
      }
      
      const response = await resend.domains.list();
      if (!response.data) {
        throw new Error('Failed to get domains from Resend API');
      }
      
      const domains = response.data as Domain[];
      
      // Update cache
      domainCache.set(this.CACHE_KEY, domains);
      lastSyncTime = new Date();
      
      logger.info(`Successfully fetched ${domains.length} domains from Resend API`);
      
      return { domains, cached: false, lastSyncTime };
    } catch (error) {
      logger.error('Error fetching domains from Resend API', { error });
      
      // If cache exists, return it as fallback
      if (domainCache.has(this.CACHE_KEY)) {
        const cachedDomains = domainCache.get<Domain[]>(this.CACHE_KEY) || [];
        return { 
          domains: cachedDomains, 
          cached: true, 
          lastSyncTime,
          error: 'Failed to fetch fresh data, showing cached data'
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Get a domain by ID
   */
  async getDomainById(id: string, forceRefresh = false): Promise<Domain> {
    try {
      // Try to get from cache first
      const { domains } = await this.getAllDomains(forceRefresh);
      const domain = domains.find(d => d.id === id);
      
      if (!domain) {
        throw new Error(`Domain with ID ${id} not found`);
      }
      
      return domain;
    } catch (error) {
      logger.error(`Error getting domain ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Get domain metrics from Resend API
   * This is not cached as it should always be fresh
   */
  async getDomainMetrics(id: string) {
    try {
      const resend = getResendClient();
      if (!resend) {
        throw new Error('Resend client not initialized');
      }
      
      // Note: This is a placeholder as Resend's API doesn't currently provide
      // per-domain metrics directly. In a real implementation, you might need
      // to use their events API and filter by domain.
      
      // For now, we'll return mock data
      return {
        id,
        deliveryRate: 0.98,
        bounceRate: 0.01,
        complaintRate: 0.001,
        last30Days: {
          sent: 10000,
          delivered: 9800,
          bounced: 100,
          complained: 10,
          opened: 6500,
          clicked: 2200
        }
      };
    } catch (error) {
      logger.error(`Error getting metrics for domain ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Force refresh the domain cache
   */
  async refreshCache(): Promise<{ 
    domains: Domain[]; 
    lastSyncTime: Date | null;
  }> {
    try {
      const { domains } = await this.getAllDomains(true);
      return { domains, lastSyncTime };
    } catch (error) {
      logger.error('Error refreshing domain cache', { error });
      throw error;
    }
  }
  
  /**
   * Get the last sync time
   */
  getLastSyncTime(): Date | null {
    return lastSyncTime;
  }
  
  /**
   * Clear the domain cache
   */
  clearCache(): void {
    domainCache.del(this.CACHE_KEY);
    logger.info('Domain cache cleared');
  }
}

export default new DomainService();
