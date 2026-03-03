import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { MeetingService } from '../services/meeting.service.js';
import logger from '../utils/logger.js';

// Get all meetings for a bookclub
export const getMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const includePast = req.query.includePast === 'true';

    const meetings = await MeetingService.getMeetings(bookClubId, includePast);

    res.json({ meetings });
  } catch (error: any) {
    logger.error('ERROR_FETCH_MEETINGS', { error: error.message });
    const statusCode = error.message === 'Book club not found' ? 404 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to fetch meetings' });
  }
};

// Create a new meeting
export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    const { title, description, meetingUrl, platform, scheduledAt, duration } = req.body;

    const meeting = await MeetingService.create(bookClubId, userId, {
      title,
      description,
      meetingUrl,
      platform,
      scheduledAt,
      duration,
    });

    res.json({ meeting, message: 'Meeting scheduled successfully' });
  } catch (error: any) {
    logger.error('ERROR_CREATE_MEETING', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('must be a member')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to create meeting' });
  }
};

// Update a meeting
export const updateMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, meetingId } = req.params;
    const userId = req.user!.userId;
    const { title, description, meetingUrl, platform, scheduledAt, duration, status } = req.body;

    const meeting = await MeetingService.update(meetingId, userId, bookClubId, {
      title,
      description,
      meetingUrl,
      platform,
      scheduledAt,
      duration,
      status,
    });

    res.json({ meeting, message: 'Meeting updated successfully' });
  } catch (error: any) {
    logger.error('ERROR_UPDATE_MEETING', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Meeting not found') statusCode = 404;
    if (error.message.includes('Only')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to update meeting' });
  }
};

// Delete a meeting
export const deleteMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, meetingId } = req.params;
    const userId = req.user!.userId;

    await MeetingService.delete(meetingId, userId, bookClubId);

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error: any) {
    logger.error('ERROR_DELETE_MEETING', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Meeting not found') statusCode = 404;
    if (error.message.includes('Only')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to delete meeting' });
  }
};

// RSVP to a meeting
export const rsvpMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, meetingId } = req.params;
    const userId = req.user!.userId;
    const { status } = req.body;

    const meeting = await MeetingService.rsvp(meetingId, userId, bookClubId, status);

    res.json({ meeting, message: 'RSVP updated' });
  } catch (error: any) {
    logger.error('ERROR_RSVP_MEETING', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Meeting not found') statusCode = 404;
    if (error.message.includes('must be a member')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to RSVP' });
  }
};

// Cancel RSVP
export const cancelRsvp = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, meetingId } = req.params;
    const userId = req.user!.userId;

    const meeting = await MeetingService.cancelRSVP(meetingId, userId, bookClubId);

    res.json({ meeting, message: 'RSVP cancelled' });
  } catch (error: any) {
    logger.error('ERROR_CANCEL_RSVP', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Meeting not found') statusCode = 404;
    res.status(statusCode).json({ error: error.message || 'Failed to cancel RSVP' });
  }
};
