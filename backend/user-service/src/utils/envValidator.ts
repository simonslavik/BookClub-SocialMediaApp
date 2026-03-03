import logger from './logger.js';

interface RequiredEnvVars {
    [key: string]: string | undefined;
}

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variables are missing
 */
export const validateEnv = (): void => {
    const requiredVars: RequiredEnvVars = {
        'DATABASE_URL': process.env.DATABASE_URL,
        'JWT_SECRET': process.env.JWT_SECRET,
        'JWT_REFRESH_SECRET': process.env.JWT_REFRESH_SECRET,
        'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
        'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    };

    const missing: string[] = [];
    const warnings: string[] = [];

    // Check for missing required variables
    for (const [key, value] of Object.entries(requiredVars)) {
        if (!value || value.trim() === '') {
            missing.push(key);
        }
    }

    // Check for placeholder values that should be changed
    if (process.env.JWT_SECRET?.includes('change-this-in-production')) {
        warnings.push('JWT_SECRET is using default value - change this in production!');
    }
    if (process.env.JWT_REFRESH_SECRET?.includes('change-this-in-production')) {
        warnings.push('JWT_REFRESH_SECRET is using default value - change this in production!');
    }

    // Check Google OAuth configuration
    if (process.env.GOOGLE_CLIENT_ID?.includes('your-google-client-id')) {
        warnings.push('GOOGLE_CLIENT_ID is using placeholder - update with real Google OAuth credentials');
    }
    if (process.env.GOOGLE_CLIENT_SECRET?.includes('your-google-client-secret')) {
        warnings.push('GOOGLE_CLIENT_SECRET is using placeholder - update with real Google OAuth credentials');
    }

    // Log warnings
    if (warnings.length > 0) {
        logger.warn('⚠️  Environment Configuration Warnings:');
        warnings.forEach(warning => logger.warn(`   - ${warning}`));
        logger.warn('');
    }

    // Throw error if critical variables are missing
    if (missing.length > 0) {
        const errorMsg = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}`;
        logger.error('❌ ' + errorMsg);
        logger.error('\nPlease check your .env file and ensure all required variables are set.');
        logger.error('See .env.example for reference.\n');
        throw new Error(errorMsg);
    }

    // Success message
    logger.info('✅ All required environment variables are set');
    
    // Log configuration summary
    logger.info('📋 Configuration Summary:');
    logger.info(`   - Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'configured'}`);
    logger.info(`   - Port: ${process.env.PORT || 3001}`);
    logger.info(`   - JWT Expiration: ${process.env.JWT_EXPIRES_IN || '15m'}`);
    logger.info(`   - Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled ✓' : 'Not configured'}`);
    logger.info('');
};

export default validateEnv;
