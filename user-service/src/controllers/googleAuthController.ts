import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { logger, logError } from '../utils/logger.js';

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Verify Google OAuth token and create/login user
 */
export const googleAuth = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { credential } = req.body;

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        if (!payload) {
            logger.warn({
                type: 'GOOGLE_AUTH_FAILED',
                action: 'GOOGLE_LOGIN',
                error: 'Invalid Google token'
            });
            return res.status(401).json({ 
                message: 'Invalid Google token' 
            });
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!email || !name) {
            logger.warn({
                type: 'GOOGLE_AUTH_FAILED',
                action: 'GOOGLE_LOGIN',
                error: 'Email and name are required from Google'
            });
            return res.status(400).json({ 
                message: 'Email and name are required from Google' 
            });
        }

        // Check if user exists with this Google ID or email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                googleId: true,
                authProvider: true,
                emailVerified: true,
                profileImage: true,
                createdAt: true
            }
        });

        // If user exists but doesn't have Google ID, link the account
        // Only auto-link if the existing local account has a verified email
        if (user && !user.googleId) {
            if (!user.emailVerified) {
                return res.status(409).json({
                    message: 'An unverified account with this email exists. Please verify your email first or login with your password.'
                });
            }
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId,
                    authProvider: 'google',
                    profileImage: picture || user.profileImage
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    googleId: true,
                    authProvider: true,
                    emailVerified: true,
                    profileImage: true,
                    createdAt: true
                }
            });
            
            logger.info({
                type: 'GOOGLE_ACCOUNT_LINKED',
                userId: user.id,
                email: user.email
            });
        }

        // If user doesn't exist, create new user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                    authProvider: 'google',
                    profileImage: picture || null,
                    password: null // OAuth users don't need password
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    googleId: true,
                    authProvider: true,
                    emailVerified: true,
                    profileImage: true,
                    createdAt: true
                }
            });
            
            logger.info({
                type: 'USER_REGISTERED_GOOGLE',
                userId: user.id,
                email: user.email,
                name: user.name
            });
        } else {
            logger.info({
                type: 'USER_LOGIN_GOOGLE',
                userId: user.id,
                email: user.email
            });
        }

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            name: user.name
        });

        res.status(200).json({
            message: 'Google authentication successful',
            user,
            accessToken,
            refreshToken
        });

    } catch (error: any) {
        logError(error, 'Google auth error');
        res.status(500).json({ 
            message: 'Error authenticating with Google'
        });
    }
};
