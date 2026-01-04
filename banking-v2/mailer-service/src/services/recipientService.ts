import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import { logger } from '../utils/logger';
import { Readable } from 'stream';
import { CampaignRecipient } from '../models/Campaign';

/**
 * Interface for a processed recipient from import
 */
export interface ProcessedRecipient {
  email: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for handling recipient list operations
 */
class RecipientService {
  /**
   * Process a CSV file and extract recipients
   * @param filePath Path to the CSV file
   * @param options Configuration options for CSV parsing
   */
  async processCSVFile(
    filePath: string,
    options: {
      emailField: string;
      firstNameField?: string;
      lastNameField?: string;
      metadataFields?: string[];
      hasHeaderRow?: boolean;
    }
  ): Promise<{
    recipients: ProcessedRecipient[];
    processed: number;
    valid: number;
    invalid: number;
    duplicates: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const recipients: ProcessedRecipient[] = [];
        const emails = new Set<string>();
        let processed = 0;
        let valid = 0;
        let invalid = 0;
        let duplicates = 0;
        
        const stream = createReadStream(filePath)
          .pipe(csvParser({
            skipLines: options.hasHeaderRow === false ? 1 : 0,
            mapHeaders: ({ header }) => header.trim(),
          }));
        
        stream.on('data', (row) => {
          processed++;
          
          // Extract email
          const email = (row[options.emailField] || '').trim().toLowerCase();
          
          // Validate email
          if (!this.isValidEmail(email)) {
            logger.debug(`Invalid email in CSV: ${email}`);
            invalid++;
            return;
          }
          
          // Check for duplicates
          if (emails.has(email)) {
            logger.debug(`Duplicate email in CSV: ${email}`);
            duplicates++;
            return;
          }
          
          emails.add(email);
          
          // Extract other fields
          const recipient: ProcessedRecipient = { email };
          
          if (options.firstNameField && row[options.firstNameField]) {
            recipient.firstName = row[options.firstNameField].trim();
          }
          
          if (options.lastNameField && row[options.lastNameField]) {
            recipient.lastName = row[options.lastNameField].trim();
          }
          
          // Extract metadata fields if specified
          if (options.metadataFields && options.metadataFields.length > 0) {
            recipient.metadata = {};
            
            for (const field of options.metadataFields) {
              if (row[field] !== undefined) {
                recipient.metadata[field] = row[field];
              }
            }
          }
          
          recipients.push(recipient);
          valid++;
        });
        
        stream.on('end', () => {
          logger.info(`CSV processing complete: ${valid} valid recipients processed`);
          
          resolve({
            recipients,
            processed,
            valid,
            invalid,
            duplicates
          });
        });
        
        stream.on('error', (error) => {
          logger.error('Error processing CSV file', { error });
          reject(error);
        });
      } catch (error) {
        logger.error('Error in CSV processing', { error });
        reject(error);
      }
    });
  }
  
  /**
   * Process a plain text file with one email per line
   * @param filePath Path to the text file
   */
  async processTextFile(filePath: string): Promise<{
    recipients: ProcessedRecipient[];
    processed: number;
    valid: number;
    invalid: number;
    duplicates: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const recipients: ProcessedRecipient[] = [];
        const emails = new Set<string>();
        let processed = 0;
        let valid = 0;
        let invalid = 0;
        let duplicates = 0;
        
        // Create readable stream from file
        const stream = createReadStream(filePath, { encoding: 'utf-8' });
        let buffer = '';
        
        stream.on('data', (chunk) => {
          buffer += chunk.toString();
          
          // Process lines when we have a complete line
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
          
          for (const line of lines) {
            processed++;
            
            // Trim and clean the email
            const email = line.trim().toLowerCase();
            
            if (!email) continue; // Skip empty lines
            
            // Validate email
            if (!this.isValidEmail(email)) {
              logger.debug(`Invalid email in text file: ${email}`);
              invalid++;
              continue;
            }
            
            // Check for duplicates
            if (emails.has(email)) {
              logger.debug(`Duplicate email in text file: ${email}`);
              duplicates++;
              continue;
            }
            
            emails.add(email);
            recipients.push({ email });
            valid++;
          }
        });
        
        stream.on('end', () => {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            processed++;
            const email = buffer.trim().toLowerCase();
            
            if (this.isValidEmail(email) && !emails.has(email)) {
              emails.add(email);
              recipients.push({ email });
              valid++;
            } else if (this.isValidEmail(email)) {
              duplicates++;
            } else {
              invalid++;
            }
          }
          
          logger.info(`Text file processing complete: ${valid} valid recipients processed`);
          
          resolve({
            recipients,
            processed,
            valid,
            invalid,
            duplicates
          });
        });
        
        stream.on('error', (error) => {
          logger.error('Error processing text file', { error });
          reject(error);
        });
      } catch (error) {
        logger.error('Error in text file processing', { error });
        reject(error);
      }
    });
  }
  
  /**
   * Process recipients from a string buffer (useful for API uploads)
   * @param content String content with one email per line
   */
  async processEmailListFromString(content: string): Promise<{
    recipients: ProcessedRecipient[];
    processed: number;
    valid: number;
    invalid: number;
    duplicates: number;
  }> {
    try {
      const recipients: ProcessedRecipient[] = [];
      const emails = new Set<string>();
      let processed = 0;
      let valid = 0;
      let invalid = 0;
      let duplicates = 0;
      
      // Split content by newlines
      const lines = content.split(/\r?\n/);
      
      for (const line of lines) {
        processed++;
        
        // Trim and clean the email
        const email = line.trim().toLowerCase();
        
        if (!email) continue; // Skip empty lines
        
        // Validate email
        if (!this.isValidEmail(email)) {
          logger.debug(`Invalid email: ${email}`);
          invalid++;
          continue;
        }
        
        // Check for duplicates
        if (emails.has(email)) {
          logger.debug(`Duplicate email: ${email}`);
          duplicates++;
          continue;
        }
        
        emails.add(email);
        recipients.push({ email });
        valid++;
      }
      
      logger.info(`String buffer processing complete: ${valid} valid recipients processed`);
      
      return {
        recipients,
        processed,
        valid,
        invalid,
        duplicates
      };
    } catch (error) {
      logger.error('Error in string buffer processing', { error });
      throw error;
    }
  }
  
  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    if (!email) return false;
    
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate a batch of recipients
   */
  async validateRecipients(recipients: ProcessedRecipient[]): Promise<{
    valid: ProcessedRecipient[];
    invalid: ProcessedRecipient[];
    duplicates: ProcessedRecipient[];
  }> {
    try {
      const valid: ProcessedRecipient[] = [];
      const invalid: ProcessedRecipient[] = [];
      const duplicates: ProcessedRecipient[] = [];
      const emails = new Set<string>();
      
      for (const recipient of recipients) {
        // Validate email
        if (!this.isValidEmail(recipient.email)) {
          invalid.push(recipient);
          continue;
        }
        
        // Check for duplicates
        if (emails.has(recipient.email.toLowerCase())) {
          duplicates.push(recipient);
          continue;
        }
        
        emails.add(recipient.email.toLowerCase());
        valid.push(recipient);
      }
      
      return {
        valid,
        invalid,
        duplicates
      };
    } catch (error) {
      logger.error('Error validating recipients', { error });
      throw error;
    }
  }
}

export default new RecipientService();
