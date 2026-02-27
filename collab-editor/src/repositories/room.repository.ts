import { Prisma, RoomType } from '@prisma/client';
import prisma from '../config/database.js';

export class RoomRepository {
  /**
   * Create a new room
   */
  static async create(data: { 
    name: string; 
    bookClubId: string; 
    description?: string;
    type?: RoomType;
    isDefault?: boolean;
    createdBy?: string;
  }) {
    return prisma.room.create({
      data,
      include: {
        _count: { select: { members: true } }
      }
    });
  }

  /**
   * Find room by ID
   */
  static async findById(id: string) {
    return prisma.room.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } }
      }
    });
  }

  /**
   * Find all rooms for a book club (visible to a user based on role)
   */
  static async findVisibleRooms(bookClubId: string, userId: string, canSeeAll: boolean) {
    if (canSeeAll) {
      return prisma.room.findMany({
        where: { bookClubId },
        include: {
          _count: { select: { members: true } },
          members: { where: { userId }, select: { id: true } }
        },
        orderBy: [{ isDefault: 'desc' }, { type: 'asc' }, { name: 'asc' }]
      });
    }

    // Return ALL rooms (including private ones the user isn't a member of)
    // The isMember check is done at the service layer using the members relation
    return prisma.room.findMany({
      where: { bookClubId },
      include: {
        _count: { select: { members: true } },
        members: { where: { userId }, select: { id: true } }
      },
      orderBy: [{ isDefault: 'desc' }, { type: 'asc' }, { name: 'asc' }]
    });
  }

  /**
   * Find all rooms for a book club (simple, no filtering)
   */
  static async findByBookClub(bookClubId: string, take = 50) {
    return prisma.room.findMany({
      where: { bookClubId },
      orderBy: { createdAt: 'asc' },
      take
    });
  }

  /**
   * Update a room
   */
  static async update(id: string, data: Prisma.RoomUpdateInput) {
    return prisma.room.update({
      where: { id },
      data,
      include: {
        _count: { select: { members: true } }
      }
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

  /**
   * Add members to a room
   */
  static async addMembers(roomId: string, userIds: string[]) {
    const existing = await prisma.roomMember.findMany({
      where: { roomId, userId: { in: userIds } },
      select: { userId: true }
    });
    const existingIds = new Set(existing.map(e => e.userId));
    const newIds = userIds.filter(id => !existingIds.has(id));

    if (newIds.length === 0) return { count: 0 };

    return prisma.roomMember.createMany({
      data: newIds.map(userId => ({ roomId, userId }))
    });
  }

  /**
   * Remove a member from a room
   */
  static async removeMember(roomId: string, userId: string) {
    return prisma.roomMember.deleteMany({
      where: { roomId, userId }
    });
  }

  /**
   * Get members of a room
   */
  static async getMembers(roomId: string) {
    return prisma.roomMember.findMany({
      where: { roomId },
      orderBy: { joinedAt: 'asc' }
    });
  }

  /**
   * Check if user is a member of a private room
   */
  static async isMember(roomId: string, userId: string) {
    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });
    return !!member;
  }
}
