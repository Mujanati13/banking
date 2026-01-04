import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';
import express from 'express';

const router = Router();

// For webhook endpoints, we need the raw body for signature verification
// This middleware captures the raw body before parsing
const rawBodyMiddleware = express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
});

// Resend webhook endpoints don't require authentication
router.post('/resend', rawBodyMiddleware, webhookController.handleWebhook);

// Debug endpoint to view tracked events (only in development)
if (process.env.NODE_ENV !== 'production') {
  router.get('/events', webhookController.getTrackedEvents);
}

export default router;
