import prisma from '../config/database';

export class ReadingProgressRepository {
  /**
   * Find all progress records for a bookclub book
   */
  static async findByBookClubBook(bookClubBookId: string) {
    return await prisma.readingProgress.findMany({
      where: { bookClubBookId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Find user's progress for a specific bookclub book (unique compound key)
   */
  static async findUserProgress(userId: string, bookClubBookId: string) {
    return await prisma.readingProgress.findUnique({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId,
        },
      },
      include: {
        bookClubBook: {
          include: { book: true },
        },
      },
    });
  }

  /**
   * Upsert reading progress for a user on a bookclub book
   */
  static async upsertProgress(
    userId: string,
    bookClubBookId: string,
    data: { pagesRead: number; notes?: string | null }
  ) {
    return await prisma.readingProgress.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId,
        },
      },
      update: {
        pagesRead: data.pagesRead,
        notes: data.notes,
        lastReadDate: new Date(),
      },
      create: {
        bookClubBookId,
        userId,
        pagesRead: data.pagesRead,
        notes: data.notes,
      },
    });
  }

  /**
   * Create progress record
   */
  static async create(data: any) {
    return await prisma.readingProgress.create({
      data,
    });
  }
}
