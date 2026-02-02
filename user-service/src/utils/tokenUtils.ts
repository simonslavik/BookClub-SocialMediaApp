import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { logError } from './logger.js';

interface User {
    id: string;
    email: string;
    name: string;
}

interface TokenPayload {
    userId: string;
    email: string;
}

interface Tokens {
    accessToken: string;
    refreshToken: string;
}

// Constants
const REFRESH_TOKEN_BYTES = 40;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const DEFAULT_JWT_EXPIRATION = '15m';

/**
 * Generate access token and refresh token for a user
 * Access token: Short-lived JWT (15 minutes by default)
 * Refresh token: Long-lived random token stored in DB (7 days)
 */
export const generateTokens = async (user: User): Promise<Tokens> => {
    // Generate short-lived access token (JWT)
    const accessToken = jwt.sign(
        {
            userId: user.id,
            email: user.email
        } as TokenPayload,
        process.env.JWT_SECRET!,
        { 
            expiresIn: process.env.JWT_EXPIRATION || DEFAULT_JWT_EXPIRATION 
        } as jwt.SignOptions
    );

    // Generate random refresh token (not JWT - just random string)
    const refreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Store refresh token in database
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt
        }
    });

    return { accessToken, refreshToken };
};

/**
 * Verify and validate a refresh token
 * Returns the associated user if valid, null otherwise
 */
export const verifyRefreshToken = async (token: string): Promise<User | null> => {
    try {
        // Find refresh token in database
        const refreshToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true }
        });

        // Token not found
        if (!refreshToken) {
            return null;
        }

        // Token expired
        if (refreshToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.refreshToken.delete({
                where: { id: refreshToken.id }
            });
            return null;
        }

        // Return user data
        return {
            id: refreshToken.user.id,
            email: refreshToken.user.email,
            name: refreshToken.user.name
        };
    } catch (error) {
        logError(error, 'Error verifying refresh token');
        return null;
    }
};

/**
 * Revoke (delete) a specific refresh token
 * Used for logout
 */
export const revokeRefreshToken = async (token: string): Promise<boolean> => {
    try {
        await prisma.refreshToken.delete({
            where: { token }
        });
        return true;
    } catch (error) {
        logError(error, 'Error revoking refresh token', { token });
        return false;
    }
};

/**
 * Revoke all refresh tokens for a user
 * Used for "logout from all devices"
 */
export const revokeAllUserTokens = async (userId: string): Promise<boolean> => {
    try {
        await prisma.refreshToken.deleteMany({
            where: { userId }
        });
        return true;
    } catch (error) {
        logError(error, 'Error revoking all user tokens', { userId });
        return false;
    }
};

/**
 * Clean up expired refresh tokens
 * Should be run periodically (cron job)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
    try {
        const result = await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        return result.count;
    } catch (error) {
        logError(error, 'Error cleaning up expired tokens');
        return 0;
    }
};

/**
 * Generate access token (JWT) for a user
 */
export const generateAccessToken = (userId: string): string => {
    return jwt.sign(
        { userId } as TokenPayload,
        process.env.JWT_SECRET!,
        { 
            expiresIn: process.env.JWT_EXPIRATION || DEFAULT_JWT_EXPIRATION 
        } as jwt.SignOptions
    );
};

/**
 * Generate refresh token (random string) for a user
 */
export const generateRefreshToken = (userId: string): string => {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
};
