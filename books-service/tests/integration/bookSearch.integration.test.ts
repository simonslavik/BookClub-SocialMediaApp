import request from 'supertest';
import express, { Express } from 'express';
import bookSearchRoutes from '../../src/routes/bookSearchRoutes';
import { GoogleBooksService } from '../../utils/googlebookapi';

// Mock Google Books API
jest.mock('../../utils/googlebookapi');

const app: Express = express();
app.use(express.json());
app.use('/v1/books', bookSearchRoutes);

describe('Book Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/books/search', () => {
    it('should search books by query', async () => {
      const mockSearchResults = [
        {
          googleBooksId: 'book1',
          title: 'Test Book 1',
          author: 'Author 1',
          description: 'Description 1',
          coverUrl: 'http://example.com/cover1.jpg',
          pageCount: 200,
          publishedDate: '2020-01-01',
          isbn: '1234567890'
        },
        {
          googleBooksId: 'book2',
          title: 'Test Book 2',
          author: 'Author 2',
          description: 'Description 2',
          coverUrl: 'http://example.com/cover2.jpg',
          pageCount: 300,
          publishedDate: '2021-01-01',
          isbn: '0987654321'
        }
      ];

      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue(mockSearchResults);

      const response = await request(app)
        .get('/v1/books/search?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Test Book 1');
      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('test');
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/v1/books/search')
        .expect(400);

      expect(response.body.error).toContain('Query parameter');
    });

    it('should handle search errors', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      const response = await request(app)
        .get('/v1/books/search?q=test')
        .expect(500);

      expect(response.body.error).toBe('API error');
    });

    it('should return empty array for no results', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/books/search?q=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /v1/books/:id', () => {
    it('should get book by ID', async () => {
      const mockBook = {
        googleBooksId: 'abc123',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test description',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 250,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get('/v1/books/abc123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Book');
      expect(GoogleBooksService.getBookById).toHaveBeenCalledWith('abc123');
    });

    it('should return 404 for non-existent book', async () => {
      (GoogleBooksService.getBookById as jest.Mock).mockRejectedValue(
        new Error('Book not found')
      );

      const response = await request(app)
        .get('/v1/books/nonexistent')
        .expect(500);

      expect(response.body.error).toBe('Book not found');
    });
  });
});
