import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { MessageModerationController } from '../controllers/messageModeration.controller.js';

const router = Router();

// Delete message (MODERATOR+ or own message)
router.delete('/messages/:messageId', authMiddleware, MessageModerationController.deleteMessage);

// Pin message (MODERATOR+)
router.post('/messages/:messageId/pin', authMiddleware, MessageModerationController.pinMessage);

// Unpin message (MODERATOR+)
router.delete('/messages/:messageId/pin', authMiddleware, MessageModerationController.unpinMessage);

// Get pinned messages for a room
router.get('/rooms/:roomId/pinned-messages', authMiddleware, MessageModerationController.getPinnedMessages);

// Edit message (own messages only)
router.put('/messages/:messageId', authMiddleware, MessageModerationController.editMessage);

export default router;
