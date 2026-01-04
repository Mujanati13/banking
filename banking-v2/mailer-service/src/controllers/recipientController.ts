import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import recipientService from '../services/recipientService';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to prevent overwrites
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter to only allow CSV and TXT files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/csv'];
  const allowedExtensions = ['.csv', '.txt'];
  
  const mimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const extname = path.extname(file.originalname).toLowerCase();
  const extensionAllowed = allowedExtensions.includes(extname);
  
  if (mimeTypeAllowed || extensionAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and TXT files are allowed'));
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

/**
 * Controller for handling recipient-related operations
 */
export const recipientController = {
  /**
   * Upload a recipient list file (CSV or TXT)
   */
  uploadRecipientList: [
    // Handle file upload using multer
    (req: Request, res: Response, next: NextFunction) => {
      upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // Multer error (e.g., file too large)
          return next(new ApiError(400, `File upload error: ${err.message}`));
        } else if (err) {
          // Other error (e.g., wrong file type)
          return next(new ApiError(400, `File upload error: ${err.message}`));
        }
        
        // No file was uploaded
        if (!req.file) {
          return next(new ApiError(400, 'No file was uploaded'));
        }
        
        next();
      });
    },
    
    // Process the uploaded file
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          throw new ApiError(400, 'No file was uploaded');
        }
        
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const campaignId = req.query.campaignId ? Number(req.query.campaignId) : undefined;
        
        // Extract configuration options from request
        const options = {
          emailField: (req.body.emailField || 'email').trim(),
          firstNameField: req.body.firstNameField ? req.body.firstNameField.trim() : undefined,
          lastNameField: req.body.lastNameField ? req.body.lastNameField.trim() : undefined,
          metadataFields: req.body.metadataFields ? req.body.metadataFields.split(',').map((f: string) => f.trim()) : [],
          hasHeaderRow: req.body.hasHeaderRow !== 'false', // Default to true
        };
        
        logger.info(`Processing recipient list file: ${req.file.originalname}`, {
          userId: req.user?.id,
          fileSize: req.file.size,
          fileType: fileExt,
          campaignId,
          options
        });
        
        let result;
        
        // Process file based on extension
        if (fileExt === '.csv') {
          result = await recipientService.processCSVFile(filePath, options);
        } else {
          result = await recipientService.processTextFile(filePath);
        }
        
        // Clean up - delete the uploaded file after processing
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Error deleting temporary file ${filePath}`, { error: err });
          }
        });
        
        // Return processing result
        return res.status(200).json({
          success: true,
          ...result,
          message: `Successfully processed ${result.valid} recipients from ${req.file.originalname}`
        });
      } catch (error) {
        // Clean up file in case of error
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, () => {
            // Ignore error during cleanup
          });
        }
        
        next(error);
      }
    }
  ],
  
  /**
   * Process a recipient list from string data
   */
  processRecipientListFromString: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        throw new ApiError(400, 'Content is required');
      }
      
      const result = await recipientService.processEmailListFromString(content);
      
      return res.status(200).json({
        success: true,
        ...result,
        message: `Successfully processed ${result.valid} recipients from provided content`
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Validate a batch of recipients
   */
  validateRecipients: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recipients } = req.body;
      
      if (!recipients || !Array.isArray(recipients)) {
        throw new ApiError(400, 'Recipients array is required');
      }
      
      const result = await recipientService.validateRecipients(recipients);
      
      return res.status(200).json({
        success: true,
        validCount: result.valid.length,
        invalidCount: result.invalid.length,
        duplicateCount: result.duplicates.length,
        valid: result.valid,
        invalid: result.invalid,
        duplicates: result.duplicates,
        message: `Validation complete: ${result.valid.length} valid, ${result.invalid.length} invalid, ${result.duplicates.length} duplicates`
      });
    } catch (error) {
      next(error);
    }
  }
};
