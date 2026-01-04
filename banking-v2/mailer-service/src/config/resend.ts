import { Resend } from 'resend';
import { logger } from '../utils/logger';

// Create and configure Resend client
const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    logger.error('RESEND_API_KEY is not set in environment variables');
    return null;
  }
  
  try {
    return new Resend(apiKey);
  } catch (error) {
    logger.error('Failed to initialize Resend client', { error });
    return null;
  }
};

export default getResendClient;
