import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import campaignExecutorService from './services/campaignExecutorService';
import routes from './routes';

// Load environment variables
config();

// Create Express server
const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(helmet()); // Security headers
// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mailer-service'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Mailer service running on port ${port}`);
  
  // Start the campaign scheduler
  const schedulerInterval = campaignExecutorService.startScheduler(5); // Check every 5 minutes
  
  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    clearInterval(schedulerInterval);
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
