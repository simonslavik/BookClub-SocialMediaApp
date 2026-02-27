import { Router } from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAllDevices } from '../controllers/userController.js';
import { getProfileById, updateMyProfile, updateMyStatus, getUserById, listUsers, getUsersByIds, searchUsers } from '../controllers/profileController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { addProfileImage, deleteProfileImage, upload } from '../controllers/profileImageController.js';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, listFriends, listFriendRequests} from '../controllers/friendsController.js';
import { getDirectMessages, sendDirectMessage, getConversations, deleteDirectMessage, markConversationAsRead, addDMReaction, removeDMReaction } from '../controllers/directMessagesController.js';
import { googleAuth } from '../controllers/googleAuthController.js';
import { forgotPassword, resetPassword, verifyEmail, resendVerification, changePassword } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authLimiter, apiLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
    sendFriendRequestSchema,
    acceptFriendRequestSchema,
    rejectFriendRequestSchema,
    removeFriendSchema,
    sendDirectMessageSchema,
    updateProfileSchema,
    updateStatusSchema,
    googleAuthSchema,
    uuidParamSchema,
    otherUserIdParamSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    paginationSchema
} from '../utils/validation.js';

const userRoutes = Router();

// Public routes (no authentication required)
userRoutes.post('/auth/register', authLimiter, validateRequest(registerSchema), asyncHandler(registerUser));
userRoutes.post('/auth/login', authLimiter, validateRequest(loginSchema), asyncHandler(loginUser));
userRoutes.post('/auth/google', authLimiter, validateRequest(googleAuthSchema), asyncHandler(googleAuth)); // Google OAuth endpoint
userRoutes.post('/auth/refresh', validateRequest(refreshTokenSchema), asyncHandler(refreshAccessToken));

// Password reset routes
userRoutes.post('/auth/forgot-password', passwordResetLimiter, validateRequest(forgotPasswordSchema), asyncHandler(forgotPassword));
userRoutes.post('/auth/reset-password', validateRequest(resetPasswordSchema), asyncHandler(resetPassword));

// Email verification routes
userRoutes.get('/auth/verify-email', validateRequest(verifyEmailSchema, 'query'), asyncHandler(verifyEmail));
userRoutes.post('/auth/resend-verification', authLimiter, validateRequest(resendVerificationSchema), asyncHandler(resendVerification));

// Batch endpoint for fetching multiple users (used by other services)
userRoutes.post('/users/batch', asyncHandler(getUsersByIds));

// Protected routes (authentication required)
// Use trustGatewayAuth when behind gateway, falls back to authMiddleware for direct calls
userRoutes.post('/auth/logout', validateRequest(logoutSchema), authMiddleware, asyncHandler(logoutUser));
userRoutes.post('/auth/logout-all', authMiddleware, asyncHandler(logoutAllDevices));
userRoutes.put('/auth/change-password', validateRequest(changePasswordSchema), authMiddleware, asyncHandler(changePassword));

// User profile routes (requires authentication)
userRoutes.get('/profile/:userId', validateRequest(uuidParamSchema, 'params'), optionalAuthMiddleware, asyncHandler(getProfileById));
userRoutes.put('/profile', validateRequest(updateProfileSchema), authMiddleware, asyncHandler(updateMyProfile));
userRoutes.patch('/profile/status', validateRequest(updateStatusSchema), authMiddleware, asyncHandler(updateMyStatus));
userRoutes.post('/profile/image', authMiddleware, upload.single('image'), asyncHandler(addProfileImage));
userRoutes.delete('/profile/image', authMiddleware, asyncHandler(deleteProfileImage));

// Admin routes (requires authentication)
userRoutes.get('/users/search', authMiddleware, asyncHandler(searchUsers));
userRoutes.get('/users', authMiddleware, asyncHandler(listUsers));
userRoutes.get('/users/:id', authMiddleware, asyncHandler(getUserById));


// Friendship and social features
userRoutes.post('/friends/request', validateRequest(sendFriendRequestSchema), authMiddleware, asyncHandler(sendFriendRequest));
userRoutes.post('/friends/accept', validateRequest(acceptFriendRequestSchema), authMiddleware, asyncHandler(acceptFriendRequest));
userRoutes.post('/friends/reject', validateRequest(rejectFriendRequestSchema), authMiddleware, asyncHandler(rejectFriendRequest));
userRoutes.delete('/friends/remove', validateRequest(removeFriendSchema), authMiddleware, asyncHandler(removeFriend));
userRoutes.get('/friends/list', validateRequest(paginationSchema, 'query'), authMiddleware, asyncHandler(listFriends));
userRoutes.get('/friends/requests', validateRequest(paginationSchema, 'query'), authMiddleware, asyncHandler(listFriendRequests));

// Direct Messages
userRoutes.get('/messages/conversations', authMiddleware, asyncHandler(getConversations));
userRoutes.get('/messages/:otherUserId', validateRequest(otherUserIdParamSchema, 'params'), validateRequest(paginationSchema, 'query'), authMiddleware, asyncHandler(getDirectMessages));
userRoutes.post('/messages', validateRequest(sendDirectMessageSchema), authMiddleware, asyncHandler(sendDirectMessage)); // Require authentication for direct HTTP calls
userRoutes.delete('/messages/:messageId', authMiddleware, asyncHandler(deleteDirectMessage));
userRoutes.put('/messages/:otherUserId/read', validateRequest(otherUserIdParamSchema, 'params'), authMiddleware, asyncHandler(markConversationAsRead));

// DM Reactions
userRoutes.post('/messages/:messageId/reactions', authMiddleware, asyncHandler(addDMReaction));
userRoutes.delete('/messages/:messageId/reactions/:emoji', authMiddleware, asyncHandler(removeDMReaction));

export default userRoutes;