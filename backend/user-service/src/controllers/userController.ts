import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { verifyRefreshToken, generateTokens, revokeRefreshToken } from '../utils/tokenUtils.js';
import logger, { logError } from '../utils/logger.js';
import { sendVerificationEmail } from './authController.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import {
    sendCreated,
    sendSuccess,
    sendServerError
} from '../utils/responseHelpers.js';
import {
    LogType,
    SuccessMessage
} from '../constants/index.js';
import { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie } from '../utils/cookieUtils.js';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const { user, accessToken, refreshToken } = await AuthService.register(name, email, password);

        // Send verification email (don't block response)
        sendVerificationEmail(user.id, user.email).catch(err => {
            logError(err, 'Failed to send verification email', { userId: user.id });
        });

        // Refresh token rides as an HttpOnly cookie — never in the JSON body.
        setRefreshCookie(res, refreshToken);

        return sendCreated(res, { user, accessToken }, SuccessMessage.USER_REGISTERED);
    } catch (error: any) {
        // AppError instances will be handled by errorHandler middleware
        if (error instanceof ConflictError || error instanceof UnauthorizedError) {
            throw error;
        }
        
        logError(error, 'Registration error', {
            type: 'REGISTRATION_ERROR',
            email: req.body.email
        });
        throw error;
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const { user, accessToken, refreshToken } = await AuthService.login(email, password);

        setRefreshCookie(res, refreshToken);

        return sendSuccess(res, { user, accessToken }, SuccessMessage.LOGIN_SUCCESS);
    } catch (error: any) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }

        logError(error, 'Login error', {
            type: 'LOGIN_ERROR',
            email: req.body.email
        });
        throw error;
    }
};

/**
 * Refresh access token using refresh token (read from HttpOnly cookie)
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

        if (!refreshToken) {
            logger.warn({
                type: LogType.REFRESH_TOKEN_INVALID,
                action: 'REFRESH_TOKEN',
                reason: 'missing_cookie'
            });
            throw new UnauthorizedError('Refresh token missing');
        }

        const user = await verifyRefreshToken(refreshToken);

        if (!user) {
            logger.warn({
                type: LogType.REFRESH_TOKEN_INVALID,
                action: 'REFRESH_TOKEN'
            });
            // Clear the bad cookie so the browser stops sending it
            clearRefreshCookie(res);
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        // Rotate tokens: delete old, generate & persist new pair
        await revokeRefreshToken(refreshToken);
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        // New refresh token replaces the old cookie
        setRefreshCookie(res, newRefreshToken);

        logger.info({
            type: LogType.TOKEN_REFRESHED,
            userId: user.id,
            email: user.email
        });

        return sendSuccess(res, { accessToken: newAccessToken }, SuccessMessage.TOKEN_REFRESHED);
    } catch (error: any) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }
        logError(error, 'Token refresh error');
        return sendServerError(res, 'Error refreshing token');
    }
};

/**
 * Logout user (revoke refresh token, clear cookie)
 */
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

        // Always clear the cookie, even if the DB delete fails — prevents
        // a stale cookie from haunting the user after logout.
        clearRefreshCookie(res);

        if (refreshToken) {
            // Best-effort revoke; ignore "not found" since the cookie is already gone.
            await AuthService.logout(refreshToken).catch((err: any) => {
                if (err?.message !== 'TOKEN_NOT_FOUND') throw err;
            });
        }

        logger.info({
            type: LogType.USER_LOGOUT,
            action: 'LOGOUT'
        });

        return sendSuccess(res, null, SuccessMessage.LOGOUT_SUCCESS);
    } catch (error: any) {
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
            throw new UnauthorizedError('Authentication required');
        }

        // Revoke all refresh tokens for this user
        await AuthService.revokeAllRefreshTokens(userId);

        logger.info({
            type: LogType.USER_LOGOUT_ALL_DEVICES,
            userId
        });

        return sendSuccess(res, null, SuccessMessage.LOGOUT_ALL_SUCCESS);
    } catch (error: any) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }
        logError(error, 'Logout all error');
        return sendServerError(res, 'Error logging out from all devices');
    }
};