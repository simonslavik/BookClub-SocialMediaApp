import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema } from '../utils/validation.js';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';

const router = Router({ mergeParams: true }); // Allow access to parent params

// Get all events for a bookclub
router.get('/', authMiddleware, getEvents);

// Create new event
router.post('/', authMiddleware, validate(createEventSchema), createEvent);

// Update event
router.patch('/:eventId', authMiddleware, validate(updateEventSchema), updateEvent);

// Delete event
router.delete('/:eventId', authMiddleware, deleteEvent);

export default router;
