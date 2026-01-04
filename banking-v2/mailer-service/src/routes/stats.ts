import { Router } from 'express';
import campaignService from '../services/campaignService';
import authMiddleware from '../middleware/auth';
import { CampaignRecipient } from '../models/Campaign';

const router = Router();

// Get campaign statistics
router.get('/campaigns/:id/stats', authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const campaign = await campaignService.getCampaignById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const recipients = await campaignService.getCampaignRecipients(campaignId);
    
    // Calculate statistics
    const stats = {
      totalRecipients: recipients.length,
      sent: recipients.filter((r: CampaignRecipient) => r.sentAt).length,
      delivered: recipients.filter((r: CampaignRecipient) => r.sentAt && !r.error).length,
      opened: recipients.filter((r: CampaignRecipient) => r.openedAt).length,
      clicked: recipients.filter((r: CampaignRecipient) => r.clickedAt).length,
      unsubscribed: recipients.filter((r: CampaignRecipient) => r.unsubscribedAt).length,
      failed: recipients.filter((r: CampaignRecipient) => r.error).length
    };
    
    // Calculate rates
    const rates = {
      deliveryRate: stats.totalRecipients > 0 ? (stats.delivered / stats.totalRecipients * 100).toFixed(1) : '0',
      openRate: stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(1) : '0',
      clickRate: stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(1) : '0',
      clickToOpenRate: stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(1) : '0',
      unsubscribeRate: stats.delivered > 0 ? (stats.unsubscribed / stats.delivered * 100).toFixed(1) : '0',
      bounceRate: stats.totalRecipients > 0 ? (stats.failed / stats.totalRecipients * 100).toFixed(1) : '0'
    };
    
    res.json({
      ...stats,
      rates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    res.status(500).json({ error: 'Failed to get campaign statistics' });
  }
});

// Get detailed recipient engagement data for a campaign
router.get('/campaigns/:id/engagement', authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const campaign = await campaignService.getCampaignById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const recipients = await campaignService.getCampaignRecipients(campaignId);
    
    // Calculate engagement over time
    const sentTimes = recipients
      .filter((r: CampaignRecipient) => r.sentAt)
      .map((r: CampaignRecipient) => ({ time: new Date(r.sentAt!).getTime(), type: 'sent' }));
    
    const openTimes = recipients
      .filter((r: CampaignRecipient) => r.openedAt)
      .map((r: CampaignRecipient) => ({ time: new Date(r.openedAt!).getTime(), type: 'opened' }));
    
    const clickTimes = recipients
      .filter((r: CampaignRecipient) => r.clickedAt)
      .map((r: CampaignRecipient) => ({ time: new Date(r.clickedAt!).getTime(), type: 'clicked' }));
    
    const unsubscribeTimes = recipients
      .filter((r: CampaignRecipient) => r.unsubscribedAt)
      .map((r: CampaignRecipient) => ({ time: new Date(r.unsubscribedAt!).getTime(), type: 'unsubscribed' }));
    
    // Combine all events and sort by time
    const allEvents = [...sentTimes, ...openTimes, ...clickTimes, ...unsubscribeTimes]
      .sort((a, b) => a.time - b.time);
    
    // Group events by hour
    const hourlyData: Record<string, { sent: number; opened: number; clicked: number; unsubscribed: number }> = {};
    
    allEvents.forEach(event => {
      const date = new Date(event.time);
      date.setMinutes(0, 0, 0); // Round to hour
      const hourKey = date.toISOString();
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { sent: 0, opened: 0, clicked: 0, unsubscribed: 0 };
      }
      
      switch (event.type) {
        case 'sent':
          hourlyData[hourKey].sent++;
          break;
        case 'opened':
          hourlyData[hourKey].opened++;
          break;
        case 'clicked':
          hourlyData[hourKey].clicked++;
          break;
        case 'unsubscribed':
          hourlyData[hourKey].unsubscribed++;
          break;
      }
    });
    
    // Convert to array for easier consumption by charts
    const engagementData = Object.entries(hourlyData).map(([time, counts]) => ({
      time,
      ...counts
    }));
    
    res.json({
      engagement: engagementData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting campaign engagement data:', error);
    res.status(500).json({ error: 'Failed to get campaign engagement data' });
  }
});

export default router;
