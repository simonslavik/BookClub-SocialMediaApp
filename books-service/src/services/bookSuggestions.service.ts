import { BookSuggestionsRepository } from '../repositories/bookSuggestions.repository';
import { BooksRepository } from '../repositories/books.repository';
import { GoogleBooksService } from './googleBooks.service';
import { VoteType } from '@prisma/client';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

const MAX_PENDING_SUGGESTIONS = 10;

export class BookSuggestionsService {
  /**
   * Get pending suggestions for a bookclub with user vote info
   */
  static async getSuggestions(bookClubId: string, userId: string, page: number = 1, limit: number = 20) {
    const result = await BookSuggestionsRepository.findPendingByBookClubId(bookClubId, page, limit);

    // Collect unique user IDs to fetch names from user-service
    const userIds = [...new Set(result.suggestions.map((s: any) => s.suggestedById))];
    let userMap: Record<string, string> = {};

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
      const response = await fetch(`${userServiceUrl}/api/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });

      if (response.ok) {
        const data = await response.json() as { success: boolean; users: Array<{ id: string; username: string }> };
        if (data.success && data.users) {
          for (const user of data.users) {
            userMap[user.id] = user.username || 'Unknown User';
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch user names from user-service', err);
    }

    const suggestionsWithUserVote = result.suggestions.map((s: any) => {
      const userVote = s.votes.find((v: any) => v.userId === userId);
      return {
        ...s,
        userVote: userVote?.voteType || null,
        suggestedBy: {
          id: s.suggestedById,
          name: userMap[s.suggestedById] || 'Unknown User',
        },
      };
    });

    return {
      data: suggestionsWithUserVote,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      limit: MAX_PENDING_SUGGESTIONS,
      remaining: Math.max(0, MAX_PENDING_SUGGESTIONS - result.total),
    };
  }

  /**
   * Suggest a book for bookclub
   */
  static async suggestBook(
    bookClubId: string,
    userId: string,
    googleBooksId: string,
    reason?: string
  ) {
    // Check suggestion limit
    const currentCount = await BookSuggestionsRepository.countPendingByBookClubId(bookClubId);
    if (currentCount >= MAX_PENDING_SUGGESTIONS) {
      throw new ConflictError(
        `This bookclub has reached the maximum of ${MAX_PENDING_SUGGESTIONS} pending suggestions. Vote on or remove existing suggestions first.`
      );
    }

    // Check for duplicate suggestion
    const existingBook = await BooksRepository.findByGoogleBooksId(googleBooksId);
    if (existingBook) {
      const existing = await BookSuggestionsRepository.findPendingByBookAndClub(bookClubId, existingBook.id);
      if (existing) {
        throw new ConflictError('This book has already been suggested');
      }
    }

    // Fetch book data from Google Books API and upsert
    const bookData = await GoogleBooksService.getBookById(googleBooksId);
    const book = await BooksRepository.upsert(googleBooksId, bookData);

    // Create suggestion
    const suggestion = await BookSuggestionsRepository.create({
      bookClubId,
      bookId: book.id,
      suggestedById: userId,
      reason: reason || null,
    });

    logger.info('Book suggested:', { bookClubId, bookId: book.id, userId });
    return suggestion;
  }

  /**
   * Vote on a suggestion (upvote/downvote) with atomic count update
   */
  static async vote(suggestionId: string, userId: string, voteType: VoteType) {
    // Verify suggestion exists
    const suggestion = await BookSuggestionsRepository.findById(suggestionId);
    if (!suggestion) {
      throw new NotFoundError('Suggestion', suggestionId);
    }

    const result = await BookSuggestionsRepository.upsertVoteWithCounts(
      suggestionId,
      userId,
      voteType
    );

    logger.info('Vote recorded:', { suggestionId, userId, voteType });
    return result;
  }

  /**
   * Accept a suggestion and make it the current book (transactional)
   */
  static async acceptSuggestion(
    bookClubId: string,
    suggestionId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const suggestion = await BookSuggestionsRepository.findById(suggestionId);
    if (!suggestion) {
      throw new NotFoundError('Suggestion', suggestionId);
    }

    // Verify suggestion belongs to this book club
    if (suggestion.bookClubId !== bookClubId) {
      throw new ForbiddenError('This suggestion does not belong to the specified book club');
    }

    const bookClubBook = await BookSuggestionsRepository.acceptSuggestion(
      bookClubId,
      suggestionId,
      suggestion.bookId,
      userId,
      startDate,
      endDate
    );

    logger.info('Suggestion accepted:', { bookClubId, suggestionId, bookId: suggestion.bookId });
    return bookClubBook;
  }

  /**
   * Delete a suggestion (only by the user who suggested it)
   */
  static async deleteSuggestion(suggestionId: string, userId: string) {
    const suggestion = await BookSuggestionsRepository.findById(suggestionId);
    if (!suggestion) {
      throw new NotFoundError('Suggestion', suggestionId);
    }

    if (suggestion.suggestedById !== userId) {
      throw new ForbiddenError('You can only delete your own suggestions');
    }

    await BookSuggestionsRepository.delete(suggestionId);
    logger.info('Book suggestion deleted:', { suggestionId, userId });
  }
}
