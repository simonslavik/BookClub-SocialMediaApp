// Set test environment variables before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.USER_SERVICE_URL = 'http://localhost:3001/api';
process.env.BOOKS_SERVICE_URL = 'http://localhost:3002';

// Suppress winston logging during tests
jest.mock('../src/utils/logger', () => {
  const noop = () => {};
  return {
    __esModule: true,
    default: { info: noop, error: noop, warn: noop, debug: noop, http: noop },
    logger: { info: noop, error: noop, warn: noop, debug: noop, success: noop, http: noop },
  };
});

export {};
