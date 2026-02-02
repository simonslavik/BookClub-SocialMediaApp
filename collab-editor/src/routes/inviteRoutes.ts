import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getInvite,
  joinViaInvite,
  getInviteInfo
} from '../controllers/inviteController.js';

const router = Router();

// Get invite for a bookclub
router.get('/bookclubs/:bookClubId/invite', authMiddleware, getInvite);

// Join via invite code
router.post('/:code/join', authMiddleware, joinViaInvite);

// Get invite info (public)
router.get('/:code', getInviteInfo);

export default router;
