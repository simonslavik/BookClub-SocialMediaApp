import prisma from '../config/database';
import { UserBookStatus } from '@prisma/client';

export class UserBooksRepository {
  /**
   * Find user's books with optional status filter and pagination
   */
  static async findByUserId(userId: string, status?: UserBookStatus, skip?: number, take?: number) {
    const where: any = { userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.userBook.findMany({
        where,
        include: { book: true },
        orderBy: { updatedAt: 'desc' },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.userBook.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find specific user book
   */
  static async findOne(userId: string, bookId: string) {
    return await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      include: { book: true },
    });
  }

  /**
   * Find user book by its primary key (id)
   */
  static async findById(userBookId: string) {
    return await prisma.userBook.findUnique({
      where: { id: userBookId },
      include: { book: true },
    });
  }

  /**
   * Create or update user book
   */
  static async upsert(userId: string, bookId: string, data: any) {
    return await prisma.userBook.upsert({
      where: {
        userId_bookId: { userId, bookId },
      },
      update: data,
      create: {
        userId,
        bookId,
        ...data,
      },
      include: { book: true },
    });
  }

  /**
   * Update user book
   */
  static async update(userId: string, bookId: string, data: any) {
    return await prisma.userBook.update({
      where: {
        userId_bookId: { userId, bookId },
      },
      data,
      include: { book: true },
    });
  }

  /**
   * Delete user book
   */
  static async delete(userId: string, bookId: string) {
    return await prisma.userBook.delete({
      where: {
        userId_bookId: { userId, bookId },
      },
    });
  }

  /**
   * Delete user book by its primary key (id)
   */
  static async deleteById(userBookId: string) {
    return await prisma.userBook.delete({
      where: { id: userBookId },
    });
  }
}
