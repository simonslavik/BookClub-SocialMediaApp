import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createRoomBodySchema } from '../utils/validation.js';
import {
  createRoom,
  getRooms,
  getRoomMessages,
  deleteRoom
} from '../controllers/roomController.js';

const router = Router({ mergeParams: true }); // Allow access to parent params

// Create new room
router.post('/', authMiddleware, validate(createRoomBodySchema), createRoom);

// Get all rooms in a bookclub
router.get('/', authMiddleware, getRooms);

// Get messages in a room
router.get('/:roomId/messages', authMiddleware, getRoomMessages);

// Delete a room
router.delete('/:roomId', authMiddleware, deleteRoom);

export default router;
