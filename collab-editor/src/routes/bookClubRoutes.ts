import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createClubSchema, updateClubSchema } from '../utils/validation.js';
import { bookClubImageUpload } from '../config/multer.js';
import {
  uploadBookClubImage,
  deleteBookClubImage
} from '../controllers/bookClubController.js';
import { BookClubController } from '../controllers/bookClub.controller.js';

const router = Router();

// ===== PUBLIC ROUTES (with optional auth) =====
// Discover bookclubs - Shows PUBLIC and PRIVATE clubs
router.get('/discover', optionalAuthMiddleware, BookClubController.discoverClubs);

// Get club preview - Limited info for non-members
router.get('/:id/preview', optionalAuthMiddleware, BookClubController.getClubPreview);

// Join via invite code
router.post('/join-by-invite/:code', authMiddleware, BookClubController.joinByInvite);

// ===== PROTECTED ROUTES (auth required) =====
// Get user's own bookclubs
router.get('/my', authMiddleware, BookClubController.getMyClubs);

// Create new bookclub
router.post('/', authMiddleware, validate(createClubSchema), BookClubController.createClub);

// Get full club details (members only)
router.get('/:id', authMiddleware, BookClubController.getClub);

// Update club settings (Admin/Owner only)
router.put('/:id', authMiddleware, validate(updateClubSchema), BookClubController.updateClub);

// Delete club (Owner only)
router.delete('/:id', authMiddleware, BookClubController.deleteClub);

// Join PUBLIC club instantly
router.post('/:id/join', authMiddleware, BookClubController.joinClub);

// Request to join PRIVATE club
router.post('/:id/request', authMiddleware, BookClubController.requestToJoin);

// Leave club
router.post('/:id/leave', authMiddleware, BookClubController.leaveClub);

// ===== MEMBERSHIP REQUEST MANAGEMENT (Admin/Owner only) =====
// Get pending requests
router.get('/:id/requests', authMiddleware, BookClubController.getPendingRequests);

// Approve request
router.post('/:id/requests/:requestId/approve', authMiddleware, BookClubController.approveRequest);

// Reject request
router.post('/:id/requests/:requestId/reject', authMiddleware, BookClubController.rejectRequest);

// ===== INVITE MANAGEMENT =====
// Get shareable invite (Any member)
router.get('/:id/invite', authMiddleware, BookClubController.getShareableInvite);

// ===== MEMBER MANAGEMENT (Admin/Owner only) =====
// Verify member role (for inter-service communication)
router.get('/:id/members/:userId/verify-role', authMiddleware, BookClubController.verifyMemberRole);

// Remove member
router.delete('/:id/members/:userId', authMiddleware, BookClubController.removeMember);

// Update member role
router.put('/:id/members/:userId/role', authMiddleware, BookClubController.updateMemberRole);

// ===== BOOK CLUB IMAGE MANAGEMENT =====
router.post('/:id/image', authMiddleware, bookClubImageUpload.single('image'), uploadBookClubImage);
router.delete('/:id/image', authMiddleware, deleteBookClubImage);

export default router;
