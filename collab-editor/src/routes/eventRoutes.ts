import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';

const router = Router({ mergeParams: true }); // Allow access to parent params

// Get all events for a bookclub
router.get('/', getEvents);

// Create new event
router.post('/', authMiddleware, createEvent);

// Update event
router.patch('/:eventId', authMiddleware, updateEvent);

// Delete event
router.delete('/:eventId', authMiddleware, deleteEvent);

export default router;
