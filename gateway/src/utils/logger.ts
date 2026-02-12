import winston from 'winston';
import fs from 'fs';
import path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Ensure logs directory exists for file transports
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * File format (JSON for parsing)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  defaultMeta: { service: 'api-gateway' },
  transports: [
    // Console output (colorized and formatted)
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5_242_880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5_242_880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export default logger;