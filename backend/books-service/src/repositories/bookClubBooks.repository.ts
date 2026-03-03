import prisma from '../config/database';
import { BookClubBookStatus } from '@prisma/client';


export class BookClubBooksRepository {
  /**
   * Find bookclub books with optional status filter and pagination
   */
  static async findByBookClubId(
    bookClubId: string,
    status?: BookClubBookStatus,
    skip?: number,
    take?: number
  ) {
    const where: any = { bookClubId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.bookClubBook.findMany({
        where,
        include: {
          book: true,
          readingProgress: {
            select: {
              userId: true,
              pagesRead: true,
              lastReadDate: true,
            },
          },
          reviews: {
            select: {
              userId: true,
              rating: true,
              reviewText: true,
              createdAt: true,
            },
          },
          ratings: {
            select: {
              userId: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.bookClubBook.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find a bookclub book by its ID
   */
  static async findById(bookClubBookId: string) {
    return await prisma.bookClubBook.findUnique({
      where: { id: bookClubBookId },
      include: { book: true },
    });
  }

  /**
   * Find specific bookclub book
   */
  static async findOne(bookClubId: string, bookId: string) {
    return await prisma.bookClubBook.findUnique({
      where: {
        bookClubId_bookId: { bookClubId, bookId },
      },
      include: { book: true },
    });
  }

  /**
   * Create bookclub book
   */
  static async create(data: any) {
    return await prisma.bookClubBook.create({
      data,
      include: { book: true },
    });
  }

  /**
   * Update bookclub book
   */
  static async update(bookClubId: string, bookId: string, data: any) {
    return await prisma.bookClubBook.update({
      where: {
        bookClubId_bookId: { bookClubId, bookId },
      },
      data,
      include: { book: true },
    });
  }

  /**
   * Delete bookclub book
   */
  static async delete(bookClubId: string, bookId: string) {
    return await prisma.bookClubBook.delete({
      where: {
        bookClubId_bookId: { bookClubId, bookId },
      },
    });
  }

  /**
   * Find current books for multiple bookclubs in a single query
   */
  static async findCurrentByBookClubIds(bookClubIds: string[]) {
    return await prisma.bookClubBook.findMany({
      where: {
        bookClubId: { in: bookClubIds },
        status: BookClubBookStatus.current,
      },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
