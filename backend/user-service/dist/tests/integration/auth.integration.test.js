import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
// Create Express app for testing
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    // Register endpoint
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, name } = req.body;
            // Validate input
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name
                }
            });
            // Generate token
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
            res.status(201).json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Login endpoint
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Missing email or password' });
            }
            // Find user
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Generate token
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    return app;
};
describe('Authentication Integration Tests', () => {
    let app;
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';
    beforeAll(async () => {
        app = createTestApp();
    });
    afterAll(async () => {
        // Cleanup test users
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'test-' } }
        });
        await prisma.$disconnect();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                email: testEmail,
                password: testPassword,
                name: testName
            })
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(testEmail);
            expect(response.body.user.name).toBe(testName);
            expect(response.body.user.role).toBe('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).not.toHaveProperty('password');
        });
        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com'
                // Missing password and name
            })
                .expect(400);
            expect(response.body.error).toBe('Missing required fields');
        });
        it('should return 409 for duplicate email', async () => {
            const duplicateEmail = `duplicate-${Date.now()}@example.com`;
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send({
                email: duplicateEmail,
                password: testPassword,
                name: testName
            })
                .expect(201);
            // Duplicate registration
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                email: duplicateEmail,
                password: testPassword,
                name: 'Another Name'
            })
                .expect(409);
            expect(response.body.error).toBe('User already exists');
        });
        it('should hash the password', async () => {
            const email = `hash-test-${Date.now()}@example.com`;
            await request(app)
                .post('/api/auth/register')
                .send({
                email,
                password: testPassword,
                name: testName
            });
            const user = await prisma.user.findUnique({ where: { email } });
            expect(user?.password).toBeDefined();
            expect(user?.password).not.toBe(testPassword);
            expect(user?.password?.length).toBeGreaterThan(testPassword.length);
        });
        it('should generate valid JWT token', async () => {
            const email = `jwt-test-${Date.now()}@example.com`;
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                email,
                password: testPassword,
                name: testName
            });
            const token = response.body.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
            expect(decoded.userId).toBe(response.body.user.id);
            expect(decoded.email).toBe(email);
            expect(decoded.role).toBe('user');
        });
    });
    describe('POST /api/auth/login', () => {
        const loginEmail = `login-${Date.now()}@example.com`;
        const loginPassword = 'LoginPass123!';
        beforeAll(async () => {
            // Create a user for login tests
            await request(app)
                .post('/api/auth/register')
                .send({
                email: loginEmail,
                password: loginPassword,
                name: 'Login Test User'
            });
        });
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: loginEmail,
                password: loginPassword
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe(loginEmail);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).not.toHaveProperty('password');
        });
        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: loginEmail
                // Missing password
            })
                .expect(400);
            expect(response.body.error).toBe('Missing email or password');
        });
        it('should return 401 for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'password123'
            })
                .expect(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
        it('should return 401 for wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: loginEmail,
                password: 'wrongpassword'
            })
                .expect(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
        it('should generate new token on each login', async () => {
            const response1 = await request(app)
                .post('/api/auth/login')
                .send({ email: loginEmail, password: loginPassword });
            const response2 = await request(app)
                .post('/api/auth/login')
                .send({ email: loginEmail, password: loginPassword });
            expect(response1.body.token).not.toBe(response2.body.token);
        });
    });
    describe('Token Validation', () => {
        it('should accept valid token', async () => {
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                email: `token-valid-${Date.now()}@example.com`,
                password: testPassword,
                name: testName
            });
            const token = registerResponse.body.token;
            // Verify token can be decoded
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
            expect(decoded).toBeDefined();
        });
        it('should reject invalid token', () => {
            const invalidToken = 'invalid.token.string';
            expect(() => {
                jwt.verify(invalidToken, process.env.JWT_SECRET || 'test-secret');
            }).toThrow();
        });
    });
});
//# sourceMappingURL=auth.integration.test.js.map