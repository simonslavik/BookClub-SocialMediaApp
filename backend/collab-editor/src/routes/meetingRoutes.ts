import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createMeetingSchema, updateMeetingSchema, rsvpSchema } from '../utils/validation.js';
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  rsvpMeeting,
  cancelRsvp,
} from '../controllers/meetingController.js';

const router = Router({ mergeParams: true }); // Access :bookClubId from parent

// Get all meetings for a bookclub
router.get('/', authMiddleware, getMeetings);

// Create a new meeting
router.post('/', authMiddleware, validate(createMeetingSchema), createMeeting);

// Update a meeting
router.patch('/:meetingId', authMiddleware, validate(updateMeetingSchema), updateMeeting);

// Delete a meeting
router.delete('/:meetingId', authMiddleware, deleteMeeting);

// RSVP to a meeting
router.post('/:meetingId/rsvp', authMiddleware, validate(rsvpSchema), rsvpMeeting);

// Cancel RSVP
router.delete('/:meetingId/rsvp', authMiddleware, cancelRsvp);

export default router;
