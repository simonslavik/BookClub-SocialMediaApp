import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables before anything else
config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/user_service';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Environment is already set above
});

afterAll(async () => {
  await prisma.$disconnect();
});

export {};
