import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

/**
 * Middleware to handle routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not found - ${req.originalUrl}`));
};
