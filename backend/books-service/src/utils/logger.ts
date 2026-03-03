import winston from 'winston';
import LokiTransport from 'winston-loki';

const isDevelopment = process.env.NODE_ENV !== 'production';
const LOKI_HOST = process.env.LOKI_HOST || 'http://loki:3100';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf((info: any) => {
        const { timestamp, level, message, service, ...meta } = info;
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
      })
    ),
  }),
];

// Add Loki transport in production or when LOKI_HOST is set
if (!isDevelopment || process.env.LOKI_HOST) {
  transports.push(
    new LokiTransport({
      host: LOKI_HOST,
      labels: { service: 'books-service' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
    })
  );
}

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  defaultMeta: { service: 'books-service' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

export default logger;
