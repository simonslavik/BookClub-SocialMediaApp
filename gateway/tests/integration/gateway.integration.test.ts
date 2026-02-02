import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock authentication middleware
const authMiddleware = (req: any, res: Response, next: NextFunction) => {
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

// Create test gateway app
const createGatewayApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
  });

  // Public auth routes (no auth required)
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Mock successful login
    const token = jwt.sign(
      { userId: 'user-123', email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    res.json({ success: true, token });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }

    res.status(201).json({ success: true, message: 'User registered' });
  });

  // Protected user routes
  app.get('/api/users/profile', authMiddleware, (req: any, res) => {
    res.json({
      userId: req.user.userId,
      email: 'test@example.com',
      username: 'testuser'
    });
  });

  app.put('/api/users/profile', authMiddleware, (req: any, res) => {
    res.json({ success: true, message: 'Profile updated' });
  });

  // Protected books routes
  app.get('/api/books/search', authMiddleware, (req, res) => {
    const { q } = req.query;
    res.json({
      books: [
        { id: '1', title: 'Test Book', author: 'Test Author' }
      ],
      query: q
    });
  });

  app.get('/api/books/user', authMiddleware, (req: any, res) => {
    res.json({
      books: [],
      userId: req.user.userId
    });
  });

  // Protected bookclub routes
  app.get('/api/bookclubs', authMiddleware, (req, res) => {
    res.json({
      bookClubs: [
        { id: '1', name: 'Test BookClub', members: [] }
      ]
    });
  });

  app.post('/api/bookclubs', authMiddleware, (req: any, res) => {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    res.status(201).json({
      success: true,
      bookClub: {
        id: 'new-bookclub-id',
        name,
        description,
        creatorId: req.user.userId
      }
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
};

describe('Gateway Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    app = createGatewayApp();
    authToken = jwt.sign(
      { userId: 'test-user-123', email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('gateway');
    });
  });

  describe('Authentication Routes', () => {
    describe('POST /api/auth/login', () => {
      it('should login successfully', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
      });

      it('should require email and password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(response.body.error).toBe('Email and password required');
      });
    });

    describe('POST /api/auth/register', () => {
      it('should register successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'new@example.com',
            password: 'password123',
            username: 'newuser'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      });

      it('should require all fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'new@example.com',
            password: 'password123'
          })
          .expect(400);

        expect(response.body.error).toBe('All fields required');
      });
    });
  });

  describe('User Routes', () => {
    describe('GET /api/users/profile', () => {
      it('should get profile with auth', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.userId).toBeDefined();
        expect(response.body.email).toBeDefined();
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .expect(401);

        expect(response.body.error).toBe('No token provided');
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update profile with auth', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ username: 'newname' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Books Routes', () => {
    describe('GET /api/books/search', () => {
      it('should search books with auth', async () => {
        const response = await request(app)
          .get('/api/books/search')
          .query({ q: 'test' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.books).toBeDefined();
        expect(response.body.query).toBe('test');
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/books/search')
          .expect(401);
      });
    });

    describe('GET /api/books/user', () => {
      it('should get user books', async () => {
        const response = await request(app)
          .get('/api/books/user')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.books).toBeDefined();
        expect(response.body.userId).toBeDefined();
      });
    });
  });

  describe('BookClub Routes', () => {
    describe('GET /api/bookclubs', () => {
      it('should get bookclubs with auth', async () => {
        const response = await request(app)
          .get('/api/bookclubs')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.bookClubs).toBeDefined();
        expect(Array.isArray(response.body.bookClubs)).toBe(true);
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/bookclubs')
          .expect(401);
      });
    });

    describe('POST /api/bookclubs', () => {
      it('should create bookclub', async () => {
        const response = await request(app)
          .post('/api/bookclubs')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'New BookClub',
            description: 'Test description'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.bookClub.name).toBe('New BookClub');
      });

      it('should require name', async () => {
        const response = await request(app)
          .post('/api/bookclubs')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ description: 'No name' })
          .expect(400);

        expect(response.body.error).toBe('Name required');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown/route')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });
  });
});
