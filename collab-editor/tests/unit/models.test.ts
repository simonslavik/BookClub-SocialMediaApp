import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('BookClub Model Tests', () => {
  const testUserId = 'test-user-' + Date.now();
  let createdBookClubId: string;

  afterAll(async () => {
    // Cleanup
    await prisma.bookClub.deleteMany({
      where: { creatorId: testUserId }
    });
    await prisma.$disconnect();
  });

  describe('Create BookClub', () => {
    it('should create a bookclub with required fields', async () => {
      const bookClubResult = await prisma.bookClub.create({
        data: {
          name: 'Test BookClub',
          description: 'A test bookclub',
          creatorId: testUserId,
          members: [testUserId],
          isPublic: true
        }
      });

      createdBookClubId = bookClubResult.id;

      expect(bookClubResult).toBeDefined();
      expect(bookClubResult.id).toBeDefined();
      expect(bookClubResult.name).toBe('Test BookClub');
      expect(bookClubResult.description).toBeDefined();
      expect(bookClubResult.creatorId).toBe(testUserId);
      expect(bookClubResult.members).toContain(testUserId);
      expect(bookClubResult.isPublic).toBe(true);
    });

    it('should create private bookclub', async () => {
      const bookClubResult = await prisma.bookClub.create({
        data: {
          name: 'Private BookClub',
          description: 'A private bookclub',
          creatorId: testUserId,
          members: [testUserId],
          isPublic: false
        }
      });

      expect(bookClubResult.isPublic).toBe(false);
    });

    it('should handle optional image URL', async () => {
      const bookClubResult = await prisma.bookClub.create({
        data: {
          name: 'BookClub with Image',
          description: 'Test',
          creatorId: testUserId,
          members: [testUserId],
          imageUrl: '/uploads/test-image.jpg'
        }
      });

      expect(bookClubResult.imageUrl).toBe('/uploads/test-image.jpg');
    });

    it('should handle category', async () => {
      const bookClubResult = await prisma.bookClub.create({
        data: {
          name: 'Fiction BookClub',
          description: 'For fiction lovers',
          creatorId: testUserId,
          members: [testUserId],
          category: 'Fiction'
        }
      });

      expect(bookClubResult.category).toBe('Fiction');
    });
  });

  describe('Update BookClub', () => {
    it('should update bookclub name', async () => {
      const updated = await prisma.bookClub.update({
        where: { id: createdBookClubId },
        data: { name: 'Updated Name' }
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should update description', async () => {
      const updated = await prisma.bookClub.update({
        where: { id: createdBookClubId },
        data: { description: 'Updated description' }
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should add members', async () => {
      const newMemberId = 'new-member-' + Date.now();
      
      const bookClubData = await prisma.bookClub.findUnique({
        where: { id: createdBookClubId }
      });

      const updated = await prisma.bookClub.update({
        where: { id: createdBookClubId },
        data: {
          members: [...(bookClubData?.members || []), newMemberId]
        }
      });

      expect(updated.members).toContain(newMemberId);
      expect(updated.members.length).toBeGreaterThan(1);
    });

    it('should remove members', async () => {
      const bookClubData = await prisma.bookClub.findUnique({
        where: { id: createdBookClubId }
      });

      const updated = await prisma.bookClub.update({
        where: { id: createdBookClubId },
        data: {
          members: [testUserId] // Remove all but creator
        }
      });

      expect(updated.members).toHaveLength(1);
      expect(updated.members).toContain(testUserId);
    });
  });

  describe('Query BookClubs', () => {
    it('should find bookclub by id', async () => {
      const bookClubData = await prisma.bookClub.findUnique({
        where: { id: createdBookClubId }
      });

      expect(bookClubData).toBeDefined();
      expect(bookClubData?.id).toBe(createdBookClubId);
    });

    it('should find bookclubs by creator', async () => {
      const bookClubs = await prisma.bookClub.findMany({
        where: { creatorId: testUserId }
      });

      expect(bookClubs.length).toBeGreaterThan(0);
      expect(bookClubs.every(bc => bc.creatorId === testUserId)).toBe(true);
    });

    it('should find public bookclubs', async () => {
      const bookClubs = await prisma.bookClub.findMany({
        where: { isPublic: true }
      });

      expect(bookClubs.every(bc => bc.isPublic === true)).toBe(true);
    });

    it('should find bookclubs where user is member', async () => {
      const bookClubs = await prisma.bookClub.findMany({
        where: {
          members: {
            has: testUserId
          }
        }
      });

      expect(bookClubs.length).toBeGreaterThan(0);
      expect(bookClubs.every(bc => bc.members.includes(testUserId))).toBe(true);
    });
  });

  describe('Delete BookClub', () => {
    it('should delete bookclub', async () => {
      const toDelete = await prisma.bookClub.create({
        data: {
          name: 'To Delete',
          description: 'Will be deleted',
          creatorId: testUserId,
          members: [testUserId]
        }
      });

      await prisma.bookClub.delete({
        where: { id: toDelete.id }
      });

      const deleted = await prisma.bookClub.findUnique({
        where: { id: toDelete.id }
      });

      expect(deleted).toBeNull();
    });
  });
});

describe('Room Model Tests', () => {
  const testUserId = 'test-user-' + Date.now();
  let testBookClubId: string;
  let testRoomId: string;

  beforeAll(async () => {
    // Create a bookclub for room tests
    const testBookClub = await prisma.bookClub.create({
      data: {
        name: 'Room Test BookClub',
        description: 'For testing rooms',
        creatorId: testUserId,
        members: [testUserId]
      }
    });
    testBookClubId = testBookClub.id;
  });

  afterAll(async () => {
    await prisma.room.deleteMany({
      where: { bookClubId: testBookClubId }
    });
    await prisma.bookClub.delete({
      where: { id: testBookClubId }
    });
    await prisma.$disconnect();
  });

  describe('Create Room', () => {
    it('should create a room', async () => {
      const roomResult = await prisma.room.create({
        data: {
          name: 'General',
          bookClubId: testBookClubId
        }
      });

      testRoomId = roomResult.id;

      expect(roomResult).toBeDefined();
      expect(roomResult.id).toBeDefined();
      expect(roomResult.name).toBe('General');
      expect(roomResult.bookClubId).toBe(testBookClubId);
    });

    it('should handle optional description', async () => {
      const roomResult = await prisma.room.create({
        data: {
          name: 'Spoilers',
          description: 'Spoiler discussions only',
          bookClubId: testBookClubId
        }
      });

      expect(roomResult.description).toBe('Spoiler discussions only');
    });
  });

  describe('Query Rooms', () => {
    it('should find rooms by bookclub', async () => {
      const rooms = await prisma.room.findMany({
        where: { bookClubId: testBookClubId }
      });

      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms.every(r => r.bookClubId === testBookClubId)).toBe(true);
    });

    it('should find room by id', async () => {
      const roomResult = await prisma.room.findUnique({
        where: { id: testRoomId }
      });

      expect(roomResult).toBeDefined();
      expect(roomResult?.id).toBe(testRoomId);
    });
  });

  describe('Update Room', () => {
    it('should update room name', async () => {
      const updated = await prisma.room.update({
        where: { id: testRoomId },
        data: { name: 'Updated Room Name' }
      });

      expect(updated.name).toBe('Updated Room Name');
    });
  });

  describe('Delete Room', () => {
    it('should delete room', async () => {
      const toDelete = await prisma.room.create({
        data: {
          name: 'Temporary Room',
          bookClubId: testBookClubId
        }
      });

      await prisma.room.delete({
        where: { id: toDelete.id }
      });

      const deleted = await prisma.room.findUnique({
        where: { id: toDelete.id }
      });

      expect(deleted).toBeNull();
    });
  });
});
