import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { EventService } from '../services/event.service.js';
import logger from '../utils/logger.js';

// Get all events for a bookclub
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { bookClubId } = req.params;
    
    const events = await EventService.getEvents(bookClubId);
    
    res.json({ events });
  } catch (error: any) {
    logger.error('ERROR_FETCH_EVENTS', { error: error.message });
    const statusCode = error.message === 'Book club not found' ? 404 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to fetch events' });
  }
};

// Create a new event
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { title, description, eventDate, eventType } = req.body;
    const userId = req.user!.userId;
    
    const event = await EventService.create(bookClubId, userId, { title, description, eventDate, eventType });
    
    res.json({ event, message: 'Event created successfully' });
  } catch (error: any) {
    logger.error('ERROR_CREATE_EVENT', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Title and event date are required') statusCode = 400;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message === 'You must be a member to create events') statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to create event' });
  }
};

// Update an event
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { title, description, eventDate, eventType } = req.body;
    const userId = req.user!.userId;
    
    const updatedEvent = await EventService.update(eventId, userId, { title, description, eventDate, eventType });
    
    res.json({ event: updatedEvent, message: 'Event updated successfully' });
  } catch (error: any) {
    logger.error('ERROR_UPDATE_EVENT', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Event not found') statusCode = 404;
    if (error.message === 'Only the event creator can update it') statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to update event' });
  }
};

// Delete an event
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.userId;
    
    await EventService.delete(eventId, userId);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    logger.error('ERROR_DELETE_EVENT', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Event not found') statusCode = 404;
    if (error.message === 'Only the event creator can delete it') statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to delete event' });
  }
};
