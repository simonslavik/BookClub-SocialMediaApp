import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { bookClubImageUpload } from '../config/multer.js';
import {
  createBookClub,
  getBookClub,
  updateBookClub,
  getAllBookClubs,
  getMyBookClubs,
  uploadBookClubImage,
  deleteBookClubImage
} from '../controllers/bookClubController.js';
import { BookClubController } from '../controllers/bookClub.controller.js';

const router = Router();

// ===== PUBLIC ROUTES (with optional auth) =====
// Discover bookclubs - Shows PUBLIC and PRIVATE clubs
router.get('/discover', optionalAuth, BookClubController.discoverClubs);

// Get club preview - Limited info for non-members
router.get('/:id/preview', optionalAuth, BookClubController.getClubPreview);

// Join via invite code
router.post('/join-by-invite/:code', authMiddleware, BookClubController.joinByInvite);

// ===== PROTECTED ROUTES (auth required) =====
// Create new bookclub
router.post('/', authMiddleware, BookClubController.createClub);

// Get full club details (members only)
router.get('/:id', authMiddleware, BookClubController.getClub);

// Update club settings (Admin/Owner only)
router.put('/:id', authMiddleware, BookClubController.updateClub);

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

// Get all invites (Admin/Owner only)
router.get('/:id/invites', authMiddleware, BookClubController.getInvites);

// Create invite
router.post('/:id/invites', authMiddleware, BookClubController.createInvite);

// Delete invite
router.delete('/:id/invites/:inviteId', authMiddleware, BookClubController.deleteInvite);

// ===== MEMBER MANAGEMENT (Admin/Owner only) =====
// Verify member role (for inter-service communication)
router.get('/:id/members/:userId/verify-role', BookClubController.verifyMemberRole);

// Remove member
router.delete('/:id/members/:userId', authMiddleware, BookClubController.removeMember);

// Update member role
router.put('/:id/members/:userId/role', authMiddleware, BookClubController.updateMemberRole);

// ===== LEGACY ROUTES (keep for backwards compatibility) =====
// Get all bookclubs (with optional filtering)
router.get('/', getAllBookClubs);

// Get my bookclubs
router.get('/my-bookclubs', authMiddleware, getMyBookClubs);

// Get bookclub by ID (old endpoint)
router.get('/:bookClubId', getBookClub);

// Update bookclub (old endpoint)
router.put('/:bookClubId', authMiddleware, updateBookClub);

// Upload bookclub image
router.post('/:id/image', authMiddleware, bookClubImageUpload.single('image'), uploadBookClubImage);

// Delete bookclub image
router.delete('/:id/image', authMiddleware, deleteBookClubImage);

export default router;
