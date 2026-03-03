"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Set test environment variables BEFORE initializing Prisma
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/books_service';
const prisma = new client_1.PrismaClient();
beforeAll(async () => {
    // Additional setup if needed
});
afterAll(async () => {
    await prisma.$disconnect();
});
// Global test utilities
global.testUserId = 'test-user-123';
global.testBookClubId = 'test-bookclub-456';
