import prisma from '../config/database';
import { SuggestionStatus, VoteType, BookClubBookStatus, Prisma } from '@prisma/client';

export class BookSuggestionsRepository {
  /**
   * Find pending suggestions for a bookclub with votes and book data
   */
  static async findPendingByBookClubId(
    bookClubId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [suggestions, total] = await Promise.all([
      prisma.bookSuggestion.findMany({
        where: {
          bookClubId,
          status: SuggestionStatus.pending,
        },
        include: {
          book: true,
          votes: {
            select: {
              userId: true,
              voteType: true,
            },
          },
        },
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.bookSuggestion.count({
        where: {
          bookClubId,
          status: SuggestionStatus.pending,
        },
      }),
    ]);

    return { suggestions, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Count pending suggestions for a bookclub
   */
  static async countPendingByBookClubId(bookClubId: string): Promise<number> {
    return prisma.bookSuggestion.count({
      where: {
        bookClubId,
        status: SuggestionStatus.pending,
      },
    });
  }

  /**
   * Find a suggestion by ID
   */
  static async findById(suggestionId: string) {
    return prisma.bookSuggestion.findUnique({
      where: { id: suggestionId },
      include: { book: true },
    });
  }

  /**
   * Find existing pending suggestion for a book in a bookclub
   */
  static async findPendingByBookAndClub(bookClubId: string, bookId: string) {
    return prisma.bookSuggestion.findFirst({
      where: {
        bookClubId,
        bookId,
        status: SuggestionStatus.pending,
      },
    });
  }

  /**
   * Create book suggestion
   */
  static async create(data: {
    bookClubId: string;
    bookId: string;
    suggestedById: string;
    reason: string | null;
  }) {
    return prisma.bookSuggestion.create({
      data,
      include: { book: true },
    });
  }

  /**
   * Update suggestion status
   */
  static async updateStatus(suggestionId: string, status: SuggestionStatus) {
    return prisma.bookSuggestion.update({
      where: { id: suggestionId },
      data: { status },
    });
  }

  /**
   * Delete suggestion
   */
  static async delete(suggestionId: string) {
    return prisma.bookSuggestion.delete({
      where: { id: suggestionId },
    });
  }

  /**
   * Upsert a vote and recalculate counts atomically in a transaction
   */
  static async upsertVoteWithCounts(
    suggestionId: string,
    userId: string,
    voteType: VoteType
  ) {
    return prisma.$transaction(async (tx) => {
      // Upsert the vote
      const vote = await tx.bookSuggestionVote.upsert({
        where: {
          suggestionId_userId: { suggestionId, userId },
        },
        update: { voteType },
        create: { suggestionId, userId, voteType },
      });

      // Recalculate counts from actual votes
      const voteCounts = await tx.bookSuggestionVote.groupBy({
        by: ['voteType'],
        where: { suggestionId },
        _count: true,
      });

      const upvotes = voteCounts.find((v) => v.voteType === VoteType.upvote)?._count || 0;
      const downvotes = voteCounts.find((v) => v.voteType === VoteType.downvote)?._count || 0;

      // Update denormalized counts
      await tx.bookSuggestion.update({
        where: { id: suggestionId },
        data: { upvotes, downvotes },
      });

      return { vote, upvotes, downvotes };
    });
  }

  /**
   * Accept a suggestion: mark current book as completed, create new current book, update suggestion status
   * All in a single transaction
   */
  static async acceptSuggestion(
    bookClubId: string,
    suggestionId: string,
    bookId: string,
    addedById: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.$transaction(async (tx) => {
      // Move current book(s) to completed
      await tx.bookClubBook.updateMany({
        where: { bookClubId, status: BookClubBookStatus.current },
        data: { status: BookClubBookStatus.completed },
      });

      // Create new current book
      const bookClubBook = await tx.bookClubBook.create({
        data: {
          bookClubId,
          bookId,
          status: BookClubBookStatus.current,
          startDate,
          endDate,
          addedById,
        },
        include: { book: true },
      });

      // Mark suggestion as accepted
      await tx.bookSuggestion.update({
        where: { id: suggestionId },
        data: { status: SuggestionStatus.accepted },
      });

      return bookClubBook;
    });
  }
}
