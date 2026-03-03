import { BookClub, Prisma } from '@prisma/client';
import prisma from '../config/database.js';

export class BookClubRepository {
  /**
   * Create a new book club with invite, default room, and owner membership
   */
  static async create(data: {
    name: string;
    category: string;
    visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
    creatorId: string;
    inviteCode: string;
    description?: string;
    requiresApproval?: boolean;
  }) {
    return prisma.bookClub.create({
      data: {
        name: data.name,
        category: data.category,
        visibility: data.visibility,
        description: data.description,
        requiresApproval: data.requiresApproval ?? false,
        creatorId: data.creatorId,
        rooms: {
          create: {
            name: 'general'
          }
        },
        invites: {
          create: {
            code: data.inviteCode,
            createdBy: data.creatorId,
            expiresAt: null,
            maxUses: null
          }
        },
        members: {
          create: {
            userId: data.creatorId,
            role: 'OWNER',
            status: 'ACTIVE',
          }
        }
      },
      include: { rooms: true, invites: true, members: true }
    });
  }

  /**
   * Find book club by ID
   */
  static async findById(id: string, includeRooms = false) {
    return prisma.bookClub.findUnique({
      where: { id },
      include: includeRooms ? {
        rooms: {
          orderBy: { createdAt: 'asc' as const }
        }
      } : undefined
    });
  }

  /**
   * Update book club
   */
  static async update(id: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
    requiresApproval: boolean;
    imageUrl: string | null;
  }>) {
    return prisma.bookClub.update({
      where: { id },
      data
    });
  }

  /**
   * Find all book clubs with filters
   */
  static async findMany(where: Prisma.BookClubWhereInput, take = 50) {
    return prisma.bookClub.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take
    });
  }

  /**
   * Find book clubs by creator
   */
  static async findByCreator(creatorId: string, take = 50) {
    return prisma.bookClub.findMany({
      where: { creatorId },
      orderBy: { updatedAt: 'desc' },
      take
    });
  }

  /**
   * Find public book clubs
   */
  static async findPublic(take = 50) {
    return this.findMany({ visibility: 'PUBLIC' }, take);
  }

  /**
   * Find user's book clubs (where user is an active member)
   */
  static async findByMember(userId: string, take = 50) {
    return prisma.bookClub.findMany({
      where: {
        members: {
          some: { userId, status: 'ACTIVE' }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take
    });
  }

  /**
   * Delete book club
   */
  static async delete(id: string) {
    return prisma.bookClub.delete({
      where: { id }
    });
  }
}
