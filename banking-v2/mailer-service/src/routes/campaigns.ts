import { Router } from 'express';
import { campaignController } from '../controllers/campaignController';

const router = Router();

// Campaign CRUD routes
router.post('/', campaignController.createCampaign);
router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Campaign operation routes
router.post('/:id/schedule', campaignController.scheduleCampaign);
router.post('/:id/start', campaignController.startCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.get('/:id/status', campaignController.getCampaignStatus);

// Campaign recipient routes
router.get('/:id/recipients', campaignController.getCampaignRecipients);
router.post('/:id/recipients', campaignController.addCampaignRecipients);

export default router;
