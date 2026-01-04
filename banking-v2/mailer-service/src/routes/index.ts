import { Router } from 'express';
import domainRoutes from './domains';
import campaignRoutes from './campaigns';
import recipientRoutes from './recipients';
import webhookRoutes from './webhooks';
import trackingRoutes from './tracking';
import statsRoutes from './stats';
import authMiddleware from '../middleware/auth';

const router = Router();

// Health check route for API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Mailer API is operational',
    timestamp: new Date().toISOString()
  });
});

// Webhook routes (no authentication required)
router.use('/webhooks', webhookRoutes);

// Tracking routes (no authentication required for open/click tracking)
router.use('/track', trackingRoutes);

// Secure all other routes with authentication
router.use(authMiddleware);

// API routes
router.use('/domains', domainRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/recipients', recipientRoutes);
router.use('/stats', statsRoutes);

export default router;
