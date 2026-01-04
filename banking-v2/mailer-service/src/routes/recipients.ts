import { Router } from 'express';
import { recipientController } from '../controllers/recipientController';

const router = Router();

// Upload recipient list file (CSV/TXT)
router.post('/upload', recipientController.uploadRecipientList);

// Process recipient list from string data
router.post('/process', recipientController.processRecipientListFromString);

// Validate recipient list
router.post('/validate', recipientController.validateRecipients);

export default router;
