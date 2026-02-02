import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { generateTokens, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/tokenUtils.js';
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
    BCRYPT_SALT_ROUNDS, 
    USER_PUBLIC_FIELDS,
    USER_BASIC_FIELDS,
    LogType,
    ErrorMessage,
    SuccessMessage 
} from '../constants/index.js';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            logger.warn({
                type: LogType.REGISTRATION_FAILED,
                reason: 'EMAIL_EXISTS',
                email
            });
            return sendConflict(res, ErrorMessage.EMAIL_EXISTS);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // Create user and generate tokens in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    profileImage: null
                },  
                select: USER_PUBLIC_FIELDS
            });

            // Generate tokens
            const tokens = await generateTokens({
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            });

            return { user: newUser, ...tokens };
        });

        const { user: newUser, accessToken, refreshToken } = result;

        // Send verification email (don't block response)
        sendVerificationEmail(newUser.id, newUser.email).catch(err => {
            logError(err, 'Failed to send verification email', { userId: newUser.id });
        });

        logger.info({
            type: LogType.USER_REGISTERED,
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name,
            emailVerified: false
        });

        return sendCreated(res, {
            user: { ...newUser, emailVerified: false },
            accessToken,
            refreshToken
        }, SuccessMessage.USER_REGISTERED);
    } catch (error: any) {
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

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            logger.warn({
                type: LogType.LOGIN_FAILED,
                reason: 'USER_NOT_FOUND',
                email
            });
            return sendUnauthorized(res, ErrorMessage.INVALID_CREDENTIALS);
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn({
                type: LogType.LOGIN_FAILED,
                reason: 'INVALID_PASSWORD',
                userId: user.id,
                email
            });
            return sendUnauthorized(res, ErrorMessage.INVALID_CREDENTIALS);
        }

        // Generate access token and refresh token
        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            name: user.name
        });

        logger.info({
            type: LogType.USER_LOGIN,
            userId: user.id,
            email: user.email
        });

        return sendSuccess(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            },
            accessToken,
            refreshToken
        }, SuccessMessage.LOGIN_SUCCESS);
    } catch (error: any) {
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

        // Verify refresh token and get user
        const user = await verifyRefreshToken(refreshToken);

        if (!user) {
            logger.warn({
                type: LogType.REFRESH_TOKEN_INVALID,
                action: 'REFRESH_TOKEN'
            });
            return sendUnauthorized(res, 'Invalid or expired refresh token');
        }

        // Delete old refresh token (token rotation)
        await revokeRefreshToken(refreshToken);

        // Generate new tokens
        const tokens = await generateTokens(user);

        logger.info({
            type: LogType.TOKEN_REFRESHED,
            userId: user.id,
            email: user.email
        });

        return sendSuccess(res, tokens, SuccessMessage.TOKEN_REFRESHED);
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

        // Revoke the refresh token
        const revoked = await revokeRefreshToken(refreshToken);

        if (!revoked) {
            logger.warn({
                type: LogType.VALIDATION_ERROR,
                action: 'LOGOUT',
                error: 'Refresh token not found'
            });
            return sendNotFound(res, 'Refresh token');
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
            return sendUnauthorized(res);
        }

        // Revoke all refresh tokens for this user
        await revokeAllUserTokens(userId);

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