import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/books_test';
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Global test utilities
global.testUserId = 'test-user-123';
global.testBookClubId = 'test-bookclub-456';

export {};
