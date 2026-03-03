import prisma from '../config/database.js';

export class InviteRepository {
  /**
   * Find invite by code
   */
  static async findByCode(code: string) {
    return prisma.bookClubInvite.findUnique({
      where: { code }
    });
  }

  /**
   * Find invites for a book club
   */
  static async findByBookClub(bookClubId: string, take = 50) {
    return prisma.bookClubInvite.findMany({
      where: { bookClubId },
      orderBy: { createdAt: 'desc' },
      take
    });
  }

  /**
   * Create a new invite
   */
  static async create(data: {
    code: string;
    bookClubId: string;
    createdBy: string;
    expiresAt: Date | null;
    maxUses: number | null;
  }) {
    return prisma.bookClubInvite.create({
      data
    });
  }

  /**
   * Update invite uses count
   */
  static async incrementUses(inviteId: string) {
    return prisma.bookClubInvite.update({
      where: { id: inviteId },
      data: {
        currentUses: {
          increment: 1
        }
      }
    });
  }

  /**
   * Delete invite
   */
  static async delete(inviteId: string) {
    return prisma.bookClubInvite.delete({
      where: { id: inviteId }
    });
  }
}
