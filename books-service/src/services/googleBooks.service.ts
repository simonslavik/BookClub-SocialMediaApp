import axios from 'axios';
import logger from '../utils/logger';
import { getRedisClient } from '../config/redis';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    pageCount?: number;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

interface BookData {
  googleBooksId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
  pageCount: number | null;
  isbn: string | null;
}

export class GoogleBooksService {
  /**
   * Search books from Google Books API with Redis caching
   */
  static async searchBooks(query: string, maxResults: number = 20): Promise<BookData[]> {
    const redis = getRedisClient();
    const cacheKey = `books:search:${query}:${maxResults}`;

    try {
      // Try to get from cache first
      if (redis && redis.isOpen) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info('✅ Cache hit for book search:', { query });
          return JSON.parse(cached);
        }
        logger.info('❌ Cache miss for book search:', { query });
      }

      const params: any = {
        q: query,
        maxResults,
        printType: 'books'
      };
      
      if (API_KEY) {
        params.key = API_KEY;
      }

      const response = await axios.get(GOOGLE_BOOKS_API, { params });
      
      const books = response.data.items?.map((item: GoogleBook) => ({
        googleBooksId: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
        coverUrl: item.volumeInfo.imageLinks?.thumbnail || null,
        description: item.volumeInfo.description || null,
        pageCount: item.volumeInfo.pageCount || null,
        isbn: item.volumeInfo.industryIdentifiers?.find(
          (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || null
      })) || [];

      // Cache the results
      if (redis && redis.isOpen && books.length > 0) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(books));
        logger.info('💾 Cached book search results:', { query, count: books.length });
      }

      return books;
    } catch (error: any) {
      logger.error('Google Books API search error:', { error: error.message, query });
      throw new Error('Failed to search books');
    }
  }

  /**
   * Get book details by Google Books ID with Redis caching
   */
  static async getBookById(googleBooksId: string): Promise<BookData> {
    const redis = getRedisClient();
    const cacheKey = `books:details:${googleBooksId}`;

    try {
      // Try to get from cache first
      if (redis && redis.isOpen) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info('✅ Cache hit for book details:', { googleBooksId });
          return JSON.parse(cached);
        }
        logger.info('❌ Cache miss for book details:', { googleBooksId });
      }

      const params: any = {};
      if (API_KEY) params.key = API_KEY;

      const response = await axios.get(`${GOOGLE_BOOKS_API}/${googleBooksId}`, { params });
      const book = response.data;

      const bookData = {
        googleBooksId: book.id,
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
        coverUrl: book.volumeInfo.imageLinks?.thumbnail || null,
        description: book.volumeInfo.description || null,
        pageCount: book.volumeInfo.pageCount || null,
        isbn: book.volumeInfo.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || null
      };

      // Cache the result
      if (redis && redis.isOpen) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(bookData));
        logger.info('💾 Cached book details:', { googleBooksId });
      }

      return bookData;
    } catch (error: any) {
      logger.error('Google Books API get book error:', { error: error.message, googleBooksId });
      throw new Error('Failed to fetch book details');
    }
  }
}
