import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/tokenUtils.js';
import logger, { logError } from '../utils/logger.js';
import { sendVerificationEmail } from './authController.js';
import { 
    sendCreated, 
    sendSuccess, 
    sendConflict, 
    sendUnauthorized, 
    sendNotFound,
    sendServerError 
} from '../utils/responseHelpers.js';
import { 
    LogType,
    ErrorMessage,
    SuccessMessage 
} from '../constants/index.js';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const result = await AuthService.register(name, email, password);

        // Send verification email (don't block response)
        sendVerificationEmail(result.user.id, result.user.email).catch(err => {
            logError(err, 'Failed to send verification email', { userId: result.user.id });
        });

        return sendCreated(res, result, SuccessMessage.USER_REGISTERED);
    } catch (error: any) {
        if (error.message === 'EMAIL_EXISTS') {
            logger.warn({
                type: LogType.REGISTRATION_FAILED,
                reason: 'EMAIL_EXISTS',
                email: req.body.email
            });
            return sendConflict(res, ErrorMessage.EMAIL_EXISTS);
        }
        
        logError(error, 'Registration error', {
            type: 'REGISTRATION_ERROR',
            email: req.body.email
        });
        return sendServerError(res, 'Error registering user');
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await AuthService.login(email, password);

        return sendSuccess(res, result, SuccessMessage.LOGIN_SUCCESS);
    } catch (error: any) {
        if (error.message === 'INVALID_CREDENTIALS' || error.message === 'OAUTH_USER') {
            logger.warn({
                type: LogType.LOGIN_FAILED,
                reason: error.message,
                email: req.body.email
            });
            return sendUnauthorized(res, ErrorMessage.INVALID_CREDENTIALS);
        }

        logError(error, 'Login error', {
            type: 'LOGIN_ERROR',
            email: req.body.email
        });
        return sendServerError(res, 'Error logging in');
    }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        // Verify refresh token
        const user = await verifyRefreshToken(refreshToken);

        if (!user) {
            logger.warn({
                type: LogType.REFRESH_TOKEN_INVALID,
                action: 'REFRESH_TOKEN'
            });
            return sendUnauthorized(res, 'Invalid or expired refresh token');
        }

        const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshAccessToken(refreshToken, user);

        logger.info({
            type: LogType.TOKEN_REFRESHED,
            userId: user.id,
            email: user.email
        });

        return sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, SuccessMessage.TOKEN_REFRESHED);
    } catch (error: any) {
        logError(error, 'Token refresh error');
        return sendServerError(res, 'Error refreshing token');
    }
};

/**
 * Logout user (revoke refresh token)
 */
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        await AuthService.logout(refreshToken);

        logger.info({
            type: LogType.USER_LOGOUT,
            action: 'LOGOUT'
        });

        return sendSuccess(res, null, SuccessMessage.LOGOUT_SUCCESS);
    } catch (error: any) {
        if (error.message === 'TOKEN_NOT_FOUND') {
            logger.warn({
                type: LogType.VALIDATION_ERROR,
                action: 'LOGOUT',
                error: 'Refresh token not found'
            });
            return sendNotFound(res, 'Refresh token');
        }

        logError(error, 'Logout error');
        return sendServerError(res, 'Error logging out');
    }
};

/**
 * Logout from all devices (revoke all refresh tokens)
 */
export const logoutAllDevices = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            logger.warn({
                type: LogType.VALIDATION_ERROR,
                action: 'LOGOUT_ALL_DEVICES',
                error: 'Authentication required'
            });
            return sendUnauthorized(res);
        }

        await AuthService.logoutAllDevices(userId);

        logger.info({
            type: LogType.USER_LOGOUT_ALL_DEVICES,
            userId
        });

        return sendSuccess(res, null, SuccessMessage.LOGOUT_ALL_SUCCESS);
    } catch (error: any) {
        logError(error, 'Logout all error');
        return sendServerError(res, 'Error logging out from all devices');
    }
};