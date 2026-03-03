/**
 * Logger utility — wraps console methods and silences debug/info in production.
 *
 * Usage:
 *   import logger from '@utils/logger';
 *   logger.debug('some value', value);   // dev only
 *   logger.info('event happened');        // dev only
 *   logger.warn('watch out');             // always
 *   logger.error('failed', err);          // always
 */
const isDev = import.meta.env.DEV;

const noop = () => {};

const logger = {
  debug: isDev ? console.log.bind(console, '[DEBUG]') : noop,
  info: isDev ? console.info.bind(console, '[INFO]') : noop,
  warn: console.warn.bind(console, '[WARN]'),
  error: console.error.bind(console, '[ERROR]'),
};

export default logger;
