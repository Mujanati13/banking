import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT tokens from request headers
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization header required');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'JWT token required');
    }
    
    // Verify token
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new ApiError(500, 'JWT_SECRET not configured');
    }
    
    try {
      const decoded = jwt.verify(token, secret) as {
        id: number;
        username: string;
        role: string;
      };
      
      // Add user info to request
      req.user = decoded;
      
      next();
    } catch (error) {
      logger.warn('Invalid token', { error });
      throw new ApiError(401, 'Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
