import winston from 'winston';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'mailer-service' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write to all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

// Export a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// If we're not in production, also log to the console with a simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
