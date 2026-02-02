import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/collab_test';
  process.env.USER_SERVICE_URL = 'http://localhost:3001/api';
});

afterAll(async () => {
  await prisma.$disconnect();
});

export {};
