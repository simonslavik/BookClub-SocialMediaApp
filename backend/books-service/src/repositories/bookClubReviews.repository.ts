import prisma from '../config/database';

export class BookClubReviewsRepository {
  /**
   * Find review by user and bookclub book
   */
  static async findByUserAndBook(userId: string, bookClubBookId: string) {
    return await prisma.bookClubBookReview.findUnique({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId,
        },
      },
    });
  }

  /**
   * Find all reviews for a bookclub book
   */
  static async findByBookClubBook(bookClubBookId: string) {
    return await prisma.bookClubBookReview.findMany({
      where: { bookClubBookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create or update review
   */
  static async upsert(userId: string, bookClubBookId: string, data: { rating: number; reviewText?: string | null }) {
    return await prisma.bookClubBookReview.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId,
        },
      },
      update: {
        rating: data.rating,
        reviewText: data.reviewText ?? null,
      },
      create: {
        userId,
        bookClubBookId,
        rating: data.rating,
        reviewText: data.reviewText ?? null,
      },
    });
  }

  /**
   * Delete review by user and bookclub book
   */
  static async delete(userId: string, bookClubBookId: string) {
    return await prisma.bookClubBookReview.delete({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId,
        },
      },
    });
  }
}
