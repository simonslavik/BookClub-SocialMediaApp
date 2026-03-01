import prisma from '../config/database';

export class BookClubBookRatingRepository {
  /**
   * Upsert a rating (create or update)
   * One rating per user per bookclub book
   */
  static async upsert(bookClubBookId: string, userId: string, rating: number, reviewText?: string | null) {
    return await prisma.bookClubBookRating.upsert({
      where: {
        bookClubBookId_userId: { bookClubBookId, userId },
      },
      update: { rating, reviewText: reviewText ?? null },
      create: { bookClubBookId, userId, rating, reviewText: reviewText ?? null },
    });
  }

  /**
   * Delete a user's rating
   */
  static async delete(bookClubBookId: string, userId: string) {
    return await prisma.bookClubBookRating.delete({
      where: {
        bookClubBookId_userId: { bookClubBookId, userId },
      },
    });
  }

  /**
   * Get a user's rating for a specific bookclub book
   */
  static async findByUser(bookClubBookId: string, userId: string) {
    return await prisma.bookClubBookRating.findUnique({
      where: {
        bookClubBookId_userId: { bookClubBookId, userId },
      },
    });
  }

  /**
   * Get rating summary for a bookclub book (average + count)
   */
  static async getSummary(bookClubBookId: string) {
    const result = await prisma.bookClubBookRating.aggregate({
      where: { bookClubBookId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
      totalRatings: result._count.rating,
    };
  }

  /**
   * Get all ratings for a bookclub book
   */
  static async findByBookClubBook(bookClubBookId: string) {
    return await prisma.bookClubBookRating.findMany({
      where: { bookClubBookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get rating summaries for multiple bookclub books in one query
   */
  static async getBatchSummaries(bookClubBookIds: string[]) {
    const ratings = await prisma.bookClubBookRating.groupBy({
      by: ['bookClubBookId'],
      where: { bookClubBookId: { in: bookClubBookIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Build a map of bookClubBookId -> summary
    const summaryMap: Record<string, { averageRating: number; totalRatings: number }> = {};
    for (const r of ratings) {
      summaryMap[r.bookClubBookId] = {
        averageRating: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : 0,
        totalRatings: r._count.rating,
      };
    }

    return summaryMap;
  }

  /**
   * Get user's ratings for multiple bookclub books in one query
   */
  static async getUserRatingsForBooks(userId: string, bookClubBookIds: string[]) {
    const ratings = await prisma.bookClubBookRating.findMany({
      where: {
        userId,
        bookClubBookId: { in: bookClubBookIds },
      },
    });

    // Build a map of bookClubBookId -> rating value
    const ratingMap: Record<string, number> = {};
    for (const r of ratings) {
      ratingMap[r.bookClubBookId] = r.rating;
    }

    return ratingMap;
  }
}
