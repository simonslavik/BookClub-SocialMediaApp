import { GoogleBooksService } from './googleBooks.service';
import logger from '../utils/logger';

export class BookSearchService {
  /**
   * Format search query for Google Books API
   * Automatically adds intitle: prefix if no special operators are present
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
    
    // Default: treat as title search
    return `intitle:${trimmedQuery}`;
  }

  /**
   * Search books using Google Books API
   */
  static async searchBooks(query: string, limit: number = 20) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      // Format the query for better results
      const formattedQuery = this.formatSearchQuery(query);
      
      const maxResults = Math.min(limit, 40); // Google Books API limit
      const books = await GoogleBooksService.searchBooks(formattedQuery, maxResults);
      
      logger.info('Books search completed:', { 
        originalQuery: query,
        formattedQuery,
        resultsCount: books.length 
      });
      return books;
    } catch (error: any) {
      logger.error('Error searching books:', { error: error.message, query });
      throw error;
    }
  }

  /**
   * Get book details by Google Books ID
   */
  static async getBookDetails(googleBooksId: string) {
    try {
      const book = await GoogleBooksService.getBookById(googleBooksId);
      
      logger.info('Book details fetched:', { googleBooksId });
      return book;
    } catch (error: any) {
      logger.error('Error fetching book details:', { error: error.message, googleBooksId });
      throw error;
    }
  }
}
