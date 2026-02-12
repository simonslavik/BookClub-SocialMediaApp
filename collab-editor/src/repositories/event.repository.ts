import prisma from '../config/database.js';

export class EventRepository {
  /**
   * Create a new event
   */
  static async create(data: {
    title: string;
    description: string | null;
    eventDate: Date;
    eventType: string;
    bookClubId: string;
    createdBy: string;
  }) {
    return prisma.bookClubEvent.create({
      data
    });
  }

  /**
   * Find event by ID
   */
  static async findById(id: string) {
    return prisma.bookClubEvent.findUnique({
      where: { id }
    });
  }

  /**
   * Find all events for a book club
   */
  static async findByBookClub(bookClubId: string) {
    return prisma.bookClubEvent.findMany({
      where: { bookClubId },
      orderBy: { eventDate: 'asc' }
    });
  }

  /**
   * Update an event
   */
  static async update(id: string, data: {
    title?: string;
    description?: string | null;
    eventDate?: Date;
    eventType?: string;
  }) {
    return prisma.bookClubEvent.update({
      where: { id },
      data
    });
  }

  /**
   * Delete an event
   */
  static async delete(id: string) {
    return prisma.bookClubEvent.delete({
      where: { id }
    });
  }
}
