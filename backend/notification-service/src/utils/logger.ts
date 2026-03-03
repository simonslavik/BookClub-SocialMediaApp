import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  logFormat === 'json'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
);

const winstonLogger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: 'notification-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  winstonLogger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  winstonLogger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export const logger = {
  info: (message: string, meta?: any) => winstonLogger.info(message, meta),
  error: (message: string, meta?: any) => winstonLogger.error(message, meta),
  warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
  debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
  success: (message: string, meta?: any) => winstonLogger.info(`✅ ${message}`, meta),
};

export default logger;
