import { GoogleBooksService } from './googleBooks.service';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class BookSearchService {
  /**
   * Format search query for Google Books API
   * Only adds a prefix for explicit patterns like ISBN
   */
  private static formatSearchQuery(query: string): string {
    const trimmedQuery = query.trim();

    // Check if query already has special operators
    const hasOperator = /^(intitle:|inauthor:|inpublisher:|subject:|isbn:)/i.test(trimmedQuery);

    if (hasOperator) {
      return trimmedQuery;
    }

    // Check if it looks like an ISBN (10 or 13 digits, possibly with hyphens)
    const isbnPattern = /^[\d-]{10,17}$/;
    if (isbnPattern.test(trimmedQuery.replace(/[-\s]/g, ''))) {
      return `isbn:${trimmedQuery.replace(/[-\s]/g, '')}`;
    }

    // Default: general search (searches title, author, description, etc.)
    return trimmedQuery;
  }

  /**
   * Search books using Google Books API
   */
  static async searchBooks(query: string, limit: number = 20) {
    if (!query || query.trim() === '') {
      throw new ValidationError('Search query is required');
    }

    const formattedQuery = this.formatSearchQuery(query);
    const maxResults = Math.min(limit, 40); // Google Books API limit
    const books = await GoogleBooksService.searchBooks(formattedQuery, maxResults);

    logger.info('Books search completed:', {
      originalQuery: query,
      formattedQuery,
      resultsCount: books.length,
    });
    return books;
  }

  /**
   * Get book details by Google Books ID
   */
  static async getBookDetails(googleBooksId: string) {
    if (!googleBooksId) {
      throw new ValidationError('Google Books ID is required');
    }

    const book = await GoogleBooksService.getBookById(googleBooksId);
    logger.info('Book details fetched:', { googleBooksId });
    return book;
  }
}
