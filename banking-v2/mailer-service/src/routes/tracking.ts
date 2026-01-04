import express from 'express';
import { logger } from '../utils/logger';
import campaignService from '../services/campaignService';

const router = express.Router();

/**
 * Track email opens
 * This endpoint is called when a tracking pixel in an email is loaded
 */
router.get('/open', async (req, res) => {
  try {
    const { cid, rid } = req.query;
    
    if (!cid || !rid) {
      return res.status(400).send('Missing parameters');
    }
    
    const campaignId = Number(cid);
    const recipientId = Number(rid);
    
    if (isNaN(campaignId) || isNaN(recipientId)) {
      return res.status(400).send('Invalid parameters');
    }
    
    logger.debug(`Email open tracked: Campaign ID ${campaignId}, Recipient ID ${recipientId}`);
    
    // Record the open event
    await campaignService.recordOpenEvent(campaignId, recipientId);
    
    // Return a 1x1 transparent pixel
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return res.send(pixel);
  } catch (error) {
    logger.error('Error tracking email open', { error });
    
    // Still return a pixel to avoid breaking the email
    res.set('Content-Type', 'image/gif');
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return res.send(pixel);
  }
});

/**
 * Track email link clicks
 * This endpoint is called when a tracked link in an email is clicked
 */
router.get('/click', async (req, res) => {
  try {
    const { cid, rid, url } = req.query;
    
    if (!cid || !rid || !url) {
      return res.status(400).send('Missing parameters');
    }
    
    const campaignId = Number(cid);
    const recipientId = Number(rid);
    const targetUrl = decodeURIComponent(url as string);
    
    if (isNaN(campaignId) || isNaN(recipientId)) {
      return res.status(400).send('Invalid parameters');
    }
    
    logger.debug(`Email click tracked: Campaign ID ${campaignId}, Recipient ID ${recipientId}, URL: ${targetUrl}`);
    
    // Record the click event
    await campaignService.recordClickEvent(campaignId, recipientId, targetUrl);
    
    // Redirect to the target URL
    return res.redirect(targetUrl);
  } catch (error) {
    logger.error('Error tracking email click', { error });
    return res.status(500).send('Error processing click');
  }
});

/**
 * Track email unsubscribes
 * This endpoint is called when a user clicks an unsubscribe link
 */
router.get('/unsubscribe', async (req, res) => {
  try {
    const { cid, rid, email } = req.query;
    
    if (!cid || !rid || !email) {
      return res.status(400).send('Missing parameters');
    }
    
    const campaignId = Number(cid);
    const recipientId = Number(rid);
    
    if (isNaN(campaignId) || isNaN(recipientId)) {
      return res.status(400).send('Invalid parameters');
    }
    
    logger.debug(`Unsubscribe request: Campaign ID ${campaignId}, Recipient ID ${recipientId}, Email: ${email}`);
    
    // Record the unsubscribe event
    await campaignService.recordUnsubscribeEvent(campaignId, recipientId);
    
    // Return a simple confirmation page
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribe Confirmation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
          h1 { color: #444; font-size: 24px; }
          .success { color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Unsubscribe Successful</h1>
          <p class="success">You have been successfully unsubscribed from this email campaign.</p>
          <p>You will no longer receive emails from this sender.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error processing unsubscribe request', { error });
    return res.status(500).send('Error processing unsubscribe request');
  }
});

export default router;
