import { EventRepository } from '../repositories/event.repository.js';
import { BookClubRepository } from '../repositories/bookClub.repository.js';
import prisma from '../config/database.js';

interface CreateEventDto {
  title: string;
  description?: string;
  eventDate: string;
  eventType?: string;
}

interface UpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: string;
  eventType?: string;
}

export class EventService {
  /**
   * Get all events for a book club
   */
  static async getEvents(bookClubId: string) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      throw new Error('Book club not found');
    }
    
    return EventRepository.findByBookClub(bookClubId);
  }

  /**
   * Create a new event
   */
  static async create(bookClubId: string, userId: string, data: CreateEventDto) {
    if (!data.title || !data.eventDate) {
      throw new Error('Title and event date are required');
    }
    
    // Check if book club exists
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      throw new Error('Book club not found');
    }
    
    // Check if user is a member using BookClubMember table
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId,
          userId
        }
      }
    });
    
    if (!membership) {
      throw new Error('You must be a member to create events');
    }

    const event = await EventRepository.create({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      eventDate: new Date(data.eventDate),
      eventType: data.eventType || 'meeting',
      bookClubId,
      createdBy: userId
    });
    
    console.log(`📅 Event created in book club ${bookClubId}: ${event.title}`);
    
    return event;
  }

  /**
   * Update an event
   */
  static async update(eventId: string, userId: string, data: UpdateEventDto) {
    const event = await EventRepository.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    if (event.createdBy !== userId) {
      throw new Error('Only the event creator can update it');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.eventDate) updateData.eventDate = new Date(data.eventDate);
    if (data.eventType) updateData.eventType = data.eventType;

    const updatedEvent = await EventRepository.update(eventId, updateData);
    
    console.log(`✏️ Event updated: ${updatedEvent.title}`);
    
    return updatedEvent;
  }

  /**
   * Delete an event
   */
  static async delete(eventId: string, userId: string) {
    const event = await EventRepository.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    if (event.createdBy !== userId) {
      throw new Error('Only the event creator can delete it');
    }

    await EventRepository.delete(eventId);
    
    console.log(`🗑️  Event deleted: ${event.title}`);
  }
}
