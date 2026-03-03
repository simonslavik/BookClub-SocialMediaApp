import logger from '../utils/logger.js';
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            type: 'HTTP_REQUEST',
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.userId || 'anonymous',
        });
    });
    next();
};
//# sourceMappingURL=requestLogger.js.map