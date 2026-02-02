import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Create test Express app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Auth middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Get all bookclubs
  app.get('/bookclubs', async (req, res) => {
    try {
      const bookClubs = await prisma.bookClub.findMany({
        where: { isPublic: true },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ bookClubs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get my bookclubs (requires auth)
  app.get('/my-bookclubs', authMiddleware, async (req: any, res) => {
    try {
      const bookClubs = await prisma.bookClub.findMany({
        where: { members: { has: req.user.userId } },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ bookClubs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create bookclub
  app.post('/bookclubs', authMiddleware, async (req: any, res) => {
    try {
      const { name, description, isPublic, category } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const bookClubResult = await prisma.bookClub.create({
        data: {
          name,
          description,
          creatorId: req.user.userId,
          members: [req.user.userId],
          isPublic: isPublic ?? true,
          category
        }
      });

      // Create default General room
      await prisma.room.create({
        data: {
          name: 'General',
          bookClubId: bookClubResult.id
        }
      });

      res.status(201).json({ success: true, bookClub: bookClubResult });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get bookclub by id
  app.get('/bookclubs/:id', async (req, res) => {
    try {
      const bookClubResult = await prisma.bookClub.findUnique({
        where: { id: req.params.id },
        include: {
          rooms: true
        }
      });

      if (!bookClubResult) {
        return res.status(404).json({ error: 'BookClub not found' });
      }

      res.json(bookClubResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update bookclub
  app.put('/bookclubs/:id', authMiddleware, async (req: any, res) => {
    try {
      const { name, description, isPublic, category } = req.body;
      const { id } = req.params;

      // Check if user is creator
      const bookClubData = await prisma.bookClub.findUnique({
        where: { id }
      });

      if (!bookClubData) {
        return res.status(404).json({ error: 'BookClub not found' });
      }

      if (bookClubData.creatorId !== req.user.userId) {
        return res.status(403).json({ error: 'Only creator can update bookclub' });
      }

      const updated = await prisma.bookClub.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(isPublic !== undefined && { isPublic }),
          ...(category && { category })
        }
      });

      res.json({ success: true, bookClub: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete bookclub
  app.delete('/bookclubs/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;

      const bookClubData = await prisma.bookClub.findUnique({
        where: { id }
      });

      if (!bookClubData) {
        return res.status(404).json({ error: 'BookClub not found' });
      }

      if (bookClubData.creatorId !== req.user.userId) {
        return res.status(403).json({ error: 'Only creator can delete bookclub' });
      }

      // Delete rooms first
      await prisma.room.deleteMany({
        where: { bookClubId: id }
      });

      // Delete bookclub
      await prisma.bookClub.delete({
        where: { id }
      });

      res.json({ success: true, message: 'BookClub deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
};

describe('BookClub API Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let testUserId: string;
  let testBookClubId: string;

  beforeAll(async () => {
    app = createTestApp();
    testUserId = 'test-user-' + Date.now();
    authToken = jwt.sign(
      { userId: testUserId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.room.deleteMany({
      where: { bookClub: { creatorId: testUserId } }
    });
    await prisma.bookClub.deleteMany({
      where: { creatorId: testUserId }
    });
    await prisma.$disconnect();
  });

  describe('POST /bookclubs', () => {
    it('should create a bookclub', async () => {
      const response = await request(app)
        .post('/bookclubs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test BookClub',
          description: 'A test bookclub',
          isPublic: true,
          category: 'Fiction'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.bookClub).toHaveProperty('id');
      expect(response.body.bookClub.name).toBe('Test BookClub');
      expect(response.body.bookClub.creatorId).toBe(testUserId);
      expect(response.body.bookClub.members).toContain(testUserId);

      testBookClubId = response.body.bookClub.id;
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/bookclubs')
        .send({
          name: 'Test BookClub',
          description: 'Test'
        })
        .expect(401);
    });

    it('should return 400 without name', async () => {
      const response = await request(app)
        .post('/bookclubs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name'
        })
        .expect(400);

      expect(response.body.error).toBe('Name is required');
    });

    it('should create default General room', async () => {
      const createResponse = await request(app)
        .post('/bookclubs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'BookClub with Room',
          description: 'Test'
        });

      const bookClubId = createResponse.body.bookClub.id;

      const rooms = await prisma.room.findMany({
        where: { bookClubId }
      });

      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms.some(r => r.name === 'General')).toBe(true);
    });
  });

  describe('GET /bookclubs', () => {
    it('should return public bookclubs', async () => {
      const response = await request(app)
        .get('/bookclubs')
        .expect(200);

      expect(response.body.bookClubs).toBeDefined();
      expect(Array.isArray(response.body.bookClubs)).toBe(true);
    });

    it('should only return public bookclubs', async () => {
      // Create private bookclub
      await request(app)
        .post('/bookclubs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Private Club',
          description: 'Private',
          isPublic: false
        });

      const response = await request(app)
        .get('/bookclubs')
        .expect(200);

      const privateClub = response.body.bookClubs.find(
        (bc: any) => bc.name === 'Private Club'
      );
      expect(privateClub).toBeUndefined();
    });
  });

  describe('GET /my-bookclubs', () => {
    it('should return user bookclubs', async () => {
      const response = await request(app)
        .get('/my-bookclubs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.bookClubs).toBeDefined();
      expect(response.body.bookClubs.length).toBeGreaterThan(0);
      expect(
        response.body.bookClubs.every((bc: any) => bc.members.includes(testUserId))
      ).toBe(true);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/my-bookclubs')
        .expect(401);
    });
  });

  describe('GET /bookclubs/:id', () => {
    it('should return bookclub with rooms', async () => {
      const response = await request(app)
        .get(`/bookclubs/${testBookClubId}`)
        .expect(200);

      expect(response.body.id).toBe(testBookClubId);
      expect(response.body.rooms).toBeDefined();
      expect(Array.isArray(response.body.rooms)).toBe(true);
    });

    it('should return 404 for non-existent bookclub', async () => {
      const response = await request(app)
        .get('/bookclubs/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('BookClub not found');
    });
  });

  describe('PUT /bookclubs/:id', () => {
    it('should update bookclub', async () => {
      const response = await request(app)
        .put(`/bookclubs/${testBookClubId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookClub.name).toBe('Updated Name');
      expect(response.body.bookClub.description).toBe('Updated description');
    });

    it('should return 403 if not creator', async () => {
      const otherUserId = 'other-user-' + Date.now();
      const otherToken = jwt.sign(
        { userId: otherUserId },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .put(`/bookclubs/${testBookClubId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Hacked' })
        .expect(403);

      expect(response.body.error).toBe('Only creator can update bookclub');
    });
  });

  describe('DELETE /bookclubs/:id', () => {
    it('should delete bookclub', async () => {
      const createResponse = await request(app)
        .post('/bookclubs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'To Delete',
          description: 'Will be deleted'
        });

      const bookClubId = createResponse.body.bookClub.id;

      const response = await request(app)
        .delete(`/bookclubs/${bookClubId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted
      const getResponse = await request(app)
        .get(`/bookclubs/${bookClubId}`)
        .expect(404);
    });

    it('should return 403 if not creator', async () => {
      const otherToken = jwt.sign(
        { userId: 'other-user-' + Date.now() },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .delete(`/bookclubs/${testBookClubId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.error).toBe('Only creator can delete bookclub');
    });
  });
});
