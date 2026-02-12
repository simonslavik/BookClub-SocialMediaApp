import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';

export class RoomRepository {
  /**
   * Create a new room
   */
  static async create(data: { name: string; bookClubId: string }) {
    return prisma.room.create({
      data
    });
  }

  /**
   * Find room by ID
   */
  static async findById(id: string) {
    return prisma.room.findUnique({
      where: { id }
    });
  }

  /**
   * Find all rooms for a book club
   */
  static async findByBookClub(bookClubId: string) {
    return prisma.room.findMany({
      where: { bookClubId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Delete a room
   */
  static async delete(id: string) {
    return prisma.room.delete({
      where: { id }
    });
  }

  /**
   * Get messages for a room
   */
  static async getMessages(roomId: string, take = 100) {
    return prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take,
      include: {
        attachments: true
      }
    });
  }
}
