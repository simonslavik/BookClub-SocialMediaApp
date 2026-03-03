import { RoomRepository } from '../repositories/room.repository.js';
import { BookClubRepository } from '../repositories/bookClub.repository.js';
import prisma from '../config/database.js';
import { MembershipStatus, BookClubRole, RoomType } from '@prisma/client';
import { hasMinRole } from '../utils/roles.js';
import logger from '../utils/logger.js';

interface CreateRoomDto {
  name: string;
  description?: string;
  type?: RoomType;
  memberIds?: string[];
}

interface UpdateRoomDto {
  name?: string;
  description?: string;
  type?: RoomType;
}

export class RoomService {
  /**
   * Create a new room in a book club
   */
  static async create(bookClubId: string, userId: string, data: CreateRoomDto) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Room name is required');
    }

    const bookClub = await BookClubRepository.findById(bookClubId);
    if (!bookClub) {
      throw new Error('Book club not found');
    }
    
    // Check membership and role
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: { bookClubId, userId }
      }
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new Error('You must be a member to create rooms');
    }

    // Only moderators+ can create rooms
    if (!hasMinRole(membership.role, BookClubRole.MODERATOR)) {
      throw new Error('Only moderators and above can create rooms');
    }

    const roomName = data.name.trim().toLowerCase().replace(/\s+/g, '-');
    const roomType = data.type || RoomType.PUBLIC;

    const room = await RoomRepository.create({
      name: roomName,
      description: data.description,
      type: roomType,
      bookClubId,
      createdBy: userId,
    });

    // For private rooms, auto-add the creator and specified members
    if (roomType === RoomType.PRIVATE) {
      const memberIds = [userId, ...(data.memberIds || []).filter(id => id !== userId)];
      await RoomRepository.addMembers(room.id, memberIds);
    }
    
    logger.info('ROOM_CREATED', { bookClubId, name: room.name, type: roomType });
    
    return room;
  }

  /**
   * Get all visible rooms for a user in a book club
   */
  static async getVisibleRooms(bookClubId: string, userId: string) {
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: { bookClubId, userId }
      }
    });

    const canSeeAll = membership 
      ? hasMinRole(membership.role, BookClubRole.MODERATOR)
      : false;

    const rooms = await RoomRepository.findVisibleRooms(bookClubId, userId, canSeeAll);

    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      isDefault: room.isDefault,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      bookClubId: room.bookClubId,
      memberCount: room._count.members,
      isMember: room.type !== 'PRIVATE' || room.members.length > 0,
    }));
  }

  /**
   * Get all rooms for a book club (simple list)
   */
  static async getRooms(bookClubId: string) {
    return RoomRepository.findByBookClub(bookClubId);
  }

  /**
   * Get messages in a room
   */
  static async getRoomMessages(roomId: string, limit = 100) {
    return RoomRepository.getMessages(roomId, limit);
  }

  /**
   * Update a room
   */
  static async update(bookClubId: string, roomId: string, userId: string, data: UpdateRoomDto) {
    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.bookClubId !== bookClubId) throw new Error('Room not found');

    const membership = await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId } }
    });
    if (!membership || !hasMinRole(membership.role, BookClubRole.MODERATOR)) {
      throw new Error('Insufficient permissions');
    }

    // Can't change type of default room
    if (room.isDefault && data.type) {
      throw new Error('Cannot change type of default room');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim().toLowerCase().replace(/\s+/g, '-');
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type) updateData.type = data.type;

    const updated = await RoomRepository.update(roomId, updateData);
    logger.info('ROOM_UPDATED', { roomId, changes: Object.keys(updateData) });
    return updated;
  }

  /**
   * Delete a room
   */
  static async delete(bookClubId: string, roomId: string, userId: string) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    if (!bookClub) throw new Error('Book club not found');

    const membership = await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId } }
    });
    if (!membership || !hasMinRole(membership.role, BookClubRole.ADMIN)) {
      throw new Error('Only admins and owners can delete rooms');
    }

    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    
    if (room.isDefault) {
      throw new Error('Cannot delete the default room');
    }

    if (room.name === 'general') {
      throw new Error('Cannot delete the general room');
    }

    const rooms = await RoomRepository.findByBookClub(bookClubId);
    if (rooms.length <= 1) {
      throw new Error('Cannot delete the last room');
    }

    await RoomRepository.delete(roomId);
    logger.info('ROOM_DELETED', { bookClubId, name: room.name });
  }

  /**
   * Add members to a private room
   */
  static async addMembers(bookClubId: string, roomId: string, userId: string, memberIds: string[]) {
    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.bookClubId !== bookClubId) throw new Error('Room not found');
    if (room.type !== RoomType.PRIVATE) throw new Error('Can only add members to private rooms');

    const membership = await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId } }
    });
    if (!membership || !hasMinRole(membership.role, BookClubRole.MODERATOR)) {
      throw new Error('Insufficient permissions');
    }

    await RoomRepository.addMembers(roomId, memberIds);
    logger.info('ROOM_MEMBERS_ADDED', { roomId, count: memberIds.length });
  }

  /**
   * Remove a member from a private room
   */
  static async removeMember(bookClubId: string, roomId: string, userId: string, targetUserId: string) {
    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.bookClubId !== bookClubId) throw new Error('Room not found');

    const membership = await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId } }
    });
    // Allow self-removal or moderator+ removal
    const isSelf = userId === targetUserId;
    if (!isSelf && (!membership || !hasMinRole(membership.role, BookClubRole.MODERATOR))) {
      throw new Error('Insufficient permissions');
    }

    await RoomRepository.removeMember(roomId, targetUserId);
    logger.info('ROOM_MEMBER_REMOVED', { roomId, targetUserId });
  }

  /**
   * Get members of a room
   */
  static async getRoomMembers(roomId: string) {
    return RoomRepository.getMembers(roomId);
  }

  /**
   * Check if user can access a room
   */
  static async canAccessRoom(roomId: string, userId: string, userRole?: string): Promise<boolean> {
    const room = await RoomRepository.findById(roomId);
    if (!room) return false;
    if (room.type === RoomType.PUBLIC || room.type === RoomType.ANNOUNCEMENT) return true;
    if (userRole && hasMinRole(userRole as BookClubRole, BookClubRole.MODERATOR)) return true;
    return RoomRepository.isMember(roomId, userId);
  }

  /**
   * Check if user can send messages in a room
   */
  static async canSendMessage(roomId: string, userId: string, userRole?: string): Promise<boolean> {
    const room = await RoomRepository.findById(roomId);
    if (!room) return false;

    // Announcement rooms: only moderators+ can send
    if (room.type === RoomType.ANNOUNCEMENT) {
      return !!userRole && hasMinRole(userRole as BookClubRole, BookClubRole.MODERATOR);
    }

    // Private rooms: must be a member (or moderator+)
    if (room.type === RoomType.PRIVATE) {
      return this.canAccessRoom(roomId, userId, userRole);
    }

    return true; // PUBLIC rooms: anyone can send
  }
}
