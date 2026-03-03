import { Router } from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAllDevices } from '../controllers/userController.js';
import { getProfileById, updateMyProfile, getUserById, listUsers, getUsersByIds } from '../controllers/profileController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { addProfileImage, deleteProfileImage, upload } from '../controllers/profileImageController.js';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, listFriends, listFriendRequests } from '../controllers/friendsController.js';
import { getDirectMessages, sendDirectMessage, getConversations } from '../controllers/directMessagesController.js';
import { googleAuth } from '../controllers/googleAuthController.js';
import { forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, refreshTokenSchema, logoutSchema, sendFriendRequestSchema, acceptFriendRequestSchema, rejectFriendRequestSchema, removeFriendSchema, sendDirectMessageSchema, updateProfileSchema, googleAuthSchema, uuidParamSchema, otherUserIdParamSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema, paginationSchema } from '../utils/validation.js';
const userRoutes = Router();
// Public routes (no authentication required)
userRoutes.post('/auth/register', authLimiter, validateRequest(registerSchema), registerUser);
userRoutes.post('/auth/login', authLimiter, validateRequest(loginSchema), loginUser);
userRoutes.post('/auth/google', authLimiter, validateRequest(googleAuthSchema), googleAuth); // Google OAuth endpoint
userRoutes.post('/auth/refresh', validateRequest(refreshTokenSchema), refreshAccessToken);
// Password reset routes
userRoutes.post('/auth/forgot-password', passwordResetLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
userRoutes.post('/auth/reset-password', validateRequest(resetPasswordSchema), resetPassword);
// Email verification routes
userRoutes.get('/auth/verify-email', validateRequest(verifyEmailSchema, 'query'), verifyEmail);
userRoutes.post('/auth/resend-verification', authLimiter, validateRequest(resendVerificationSchema), resendVerification);
// Batch endpoint for fetching multiple users (used by other services)
userRoutes.post('/users/batch', getUsersByIds);
// Protected routes (authentication required)
// Use trustGatewayAuth when behind gateway, falls back to authMiddleware for direct calls
userRoutes.post('/auth/logout', validateRequest(logoutSchema), authMiddleware, logoutUser);
userRoutes.post('/auth/logout-all', authMiddleware, logoutAllDevices);
// User profile routes (requires authentication)
userRoutes.get('/profile/:userId', validateRequest(uuidParamSchema, 'params'), optionalAuthMiddleware, getProfileById);
userRoutes.put('/profile', validateRequest(updateProfileSchema), authMiddleware, updateMyProfile);
userRoutes.post('/profile/image', authMiddleware, upload.single('image'), addProfileImage);
userRoutes.delete('/profile/image', authMiddleware, deleteProfileImage);
// Admin routes (requires authentication)
userRoutes.get('/users', authMiddleware, listUsers);
userRoutes.get('/users/:id', authMiddleware, getUserById);
// Friendship and social features
userRoutes.post('/friends/request', validateRequest(sendFriendRequestSchema), authMiddleware, sendFriendRequest);
userRoutes.post('/friends/accept', validateRequest(acceptFriendRequestSchema), authMiddleware, acceptFriendRequest);
userRoutes.post('/friends/reject', validateRequest(rejectFriendRequestSchema), authMiddleware, rejectFriendRequest);
userRoutes.delete('/friends/remove', validateRequest(removeFriendSchema), authMiddleware, removeFriend);
userRoutes.get('/friends/list', validateRequest(paginationSchema, 'query'), authMiddleware, listFriends);
userRoutes.get('/friends/requests', validateRequest(paginationSchema, 'query'), authMiddleware, listFriendRequests);
// Direct Messages
userRoutes.get('/messages/conversations', authMiddleware, getConversations);
userRoutes.get('/messages/:otherUserId', validateRequest(otherUserIdParamSchema, 'params'), validateRequest(paginationSchema, 'query'), authMiddleware, getDirectMessages);
userRoutes.post('/messages', validateRequest(sendDirectMessageSchema), authMiddleware, sendDirectMessage); // Require authentication for direct HTTP calls
export default userRoutes;
//# sourceMappingURL=userRoutes.js.map