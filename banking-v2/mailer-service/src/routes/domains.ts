import { Router } from 'express';
import { domainController } from '../controllers/domainController';

const router = Router();

// Get all domains
router.get('/', domainController.getAllDomains);

// Get domain cache status
router.get('/cache-status', domainController.getCacheStatus);

// Force refresh domain cache
router.post('/refresh', domainController.refreshDomains);

// Get domain by ID
router.get('/:id', domainController.getDomainById);

// Get domain metrics
router.get('/:id/metrics', domainController.getDomainMetrics);

export default router;
