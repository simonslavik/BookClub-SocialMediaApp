// Set test environment variables before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.USER_SERVICE_URL = 'http://localhost:3001';
process.env.BOOKS_SERVICE_URL = 'http://localhost:3002';
process.env.COLLAB_EDITOR_URL = 'http://localhost:4000';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PORT = '3000';

// Suppress console output during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
