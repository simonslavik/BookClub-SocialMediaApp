beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.USER_SERVICE_URL = 'http://localhost:3001/api';
  process.env.BOOKS_SERVICE_URL = 'http://localhost:3002/api';
  process.env.COLLAB_SERVICE_URL = 'http://localhost:3003/api';
});

export {};
