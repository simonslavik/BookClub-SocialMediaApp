import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

// Get all events for a bookclub
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { bookClubId } = req.params;
    
    // Check if bookclub exists
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    // Get all events for this bookclub
    const events = await prisma.bookClubEvent.findMany({
      where: { bookClubId },
      orderBy: { eventDate: 'asc' }
    });
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Create a new event
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { title, description, eventDate, eventType } = req.body;
    const userId = req.user!.userId;
    
    if (!title || !eventDate) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }
    
    // Check if user is a member of the bookclub
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (!bookClub.members.includes(userId)) {
      return res.status(403).json({ error: 'You must be a member to create events' });
    }
    
    const event = await prisma.bookClubEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        eventDate: new Date(eventDate),
        eventType: eventType || 'meeting',
        bookClubId,
        createdBy: userId
      }
    });
    
    console.log(`📅 Event created in book club ${bookClubId}: ${event.title}`);
    res.json({ event, message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update an event
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { title, description, eventDate, eventType } = req.body;
    const userId = req.user!.userId;
    
    const event = await prisma.bookClubEvent.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the event creator can update it' });
    }
    
    const updatedEvent = await prisma.bookClubEvent.update({
      where: { id: eventId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(eventType && { eventType })
      }
    });
    
    console.log(`📝 Event updated: ${updatedEvent.title}`);
    res.json({ event: updatedEvent, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete an event
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.userId;
    
    const event = await prisma.bookClubEvent.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the event creator can delete it' });
    }
    
    await prisma.bookClubEvent.delete({
      where: { id: eventId }
    });
    
    console.log(`🗑️  Event deleted: ${event.title}`);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
