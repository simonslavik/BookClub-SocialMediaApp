import request from 'supertest';
import express, { Express } from 'express';
import userBooksRoutes from '../../src/routes/userBooksRoutes';
import prisma from '../../src/config/database';
import jwt from 'jsonwebtoken';

const app: Express = express();
app.use(express.json());
app.use('/v1/user-books', userBooksRoutes);

describe('User Books Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testBookId: string;

  beforeAll(async () => {
    // Create test user token
    testUserId = 'integration-test-user-' + Date.now();
    authToken = jwt.sign(
      { 
        userId: testUserId, 
        email: 'test@example.com',
        role: 'user'
      },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Clean up any existing test data
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    });

    if (testBookId) {
      await prisma.book.deleteMany({
        where: { id: testBookId }
      });
    }

    await prisma.$disconnect();
  });

  describe('GET /v1/user-books', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/v1/user-books')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array for new user', async () => {
      const response = await request(app)
        .get('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should filter books by status', async () => {
      // First add a book
      const addResponse = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId: 'test-book-123',
          status: 'reading',
          rating: 4
        });

      expect(addResponse.status).toBe(200);

      // Then filter by status
      const response = await request(app)
        .get('/v1/user-books?status=reading')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].status).toBe('reading');
    });
  });

  describe('POST /v1/user-books', () => {
    it('should add a book to user library', async () => {
      const response = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId: 'test-google-book-456',
          status: 'want_to_read',
          rating: 3,
          review: 'Looking forward to reading this'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('want_to_read');
      expect(response.body.data.rating).toBe(3);

      testBookId = response.body.data.bookId;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'reading'
          // Missing googleBooksId
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId: 'test-123',
          status: 'invalid_status'
        })
        .expect(400);

      expect(response.body.error).toContain('Status must be one of');
    });

    it('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId: 'test-123',
          status: 'reading',
          rating: 6 // Invalid
        })
        .expect(400);

      expect(response.body.error).toContain('Rating cannot exceed 5');
    });

    it('should update existing book instead of creating duplicate', async () => {
      const googleBooksId = 'test-duplicate-' + Date.now();

      // Add book first time
      const firstResponse = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId,
          status: 'reading',
          rating: 3
        })
        .expect(200);

      const firstBookId = firstResponse.body.data.id;

      // Add same book again with different data
      const secondResponse = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId,
          status: 'completed',
          rating: 5
        })
        .expect(200);

      // Should update, not create new
      expect(secondResponse.body.data.id).toBe(firstBookId);
      expect(secondResponse.body.data.status).toBe('completed');
      expect(secondResponse.body.data.rating).toBe(5);
    });
  });

  describe('PUT /v1/user-books/:bookId', () => {
    let bookIdToUpdate: string;

    beforeAll(async () => {
      // Add a book to update
      const response = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId: 'test-update-' + Date.now(),
          status: 'reading'
        });

      bookIdToUpdate = response.body.data.bookId;
    });

    it('should update book status', async () => {
      const response = await request(app)
        .put(`/v1/user-books/${bookIdToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
          rating: 5,
          review: 'Finished it!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.rating).toBe(5);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .put('/v1/user-books/non-existent-book-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed'
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should allow partial updates', async () => {
      const response = await request(app)
        .put(`/v1/user-books/${bookIdToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4 // Only update rating
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(4);
    });
  });

  describe('DELETE /v1/user-books/:bookId', () => {
    let bookIdToDelete: string;

    beforeEach(async () => {
      // Add a book to delete
      const response = await request(app)
        .post('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleBooksId: 'test-delete-' + Date.now(),
          status: 'reading'
        });

      bookIdToDelete = response.body.data.bookId;
    });

    it('should delete book from library', async () => {
      const response = await request(app)
        .delete(`/v1/user-books/${bookIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');

      // Verify book is deleted
      const getResponse = await request(app)
        .get('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedBook = getResponse.body.data.find(
        (book: any) => book.bookId === bookIdToDelete
      );
      expect(deletedBook).toBeUndefined();
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete('/v1/user-books/non-existent-book')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      await request(app)
        .get('/v1/user-books')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app)
        .get('/v1/user-books')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should accept valid token', async () => {
      await request(app)
        .get('/v1/user-books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
