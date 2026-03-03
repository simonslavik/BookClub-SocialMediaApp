import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createRoomBodySchema, updateRoomBodySchema } from '../utils/validation.js';
import {
  createRoom,
  getRooms,
  getRoomMessages,
  updateRoom,
  deleteRoom,
  addRoomMembers,
  removeRoomMember,
  getRoomMembers
} from '../controllers/roomController.js';

const router = Router({ mergeParams: true }); // Allow access to parent params

// Create new room
router.post('/', authMiddleware, validate(createRoomBodySchema), createRoom);

// Get all visible rooms in a bookclub
router.get('/', authMiddleware, getRooms);

// Get messages in a room
router.get('/:roomId/messages', authMiddleware, getRoomMessages);

// Update a room
router.patch('/:roomId', authMiddleware, validate(updateRoomBodySchema), updateRoom);

// Delete a room
router.delete('/:roomId', authMiddleware, deleteRoom);

// Add members to a private room
router.post('/:roomId/members', authMiddleware, addRoomMembers);

// Remove a member from a private room
router.delete('/:roomId/members/:userId', authMiddleware, removeRoomMember);

// Get members of a room
router.get('/:roomId/members', authMiddleware, getRoomMembers);

export default router;
