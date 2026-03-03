import {
  createBookClubSchema,
  updateBookClubSchema,
  bookClubIdSchema,
  createInviteSchema,
  inviteCodeSchema,
  createEventSchema,
  updateEventSchema,
  eventIdSchema,
  createRoomBodySchema,
  createClubSchema,
  updateClubSchema,
  uuidParamSchema,
} from '../../src/utils/validation';

describe('Validation Schemas', () => {
  describe('createBookClubSchema', () => {
    it('should accept valid data', () => {
      const result = createBookClubSchema.safeParse({
        name: 'My Book Club',
        category: 'Fiction',
        isPublic: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createBookClubSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 chars', () => {
      const result = createBookClubSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const result = createBookClubSchema.safeParse({ name: 'Test Club' });
      expect(result.success).toBe(true);
    });
  });

  describe('updateBookClubSchema', () => {
    it('should accept partial updates', () => {
      const result = updateBookClubSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no updates)', () => {
      const result = updateBookClubSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('bookClubIdSchema', () => {
    it('should accept valid UUID', () => {
      const result = bookClubIdSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = bookClubIdSchema.safeParse({ id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('createInviteSchema', () => {
    it('should accept valid invite data', () => {
      const result = createInviteSchema.safeParse({
        bookClubId: '550e8400-e29b-41d4-a716-446655440000',
        maxUses: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid bookClubId', () => {
      const result = createInviteSchema.safeParse({ bookClubId: 'bad-id' });
      expect(result.success).toBe(false);
    });

    it('should reject negative maxUses', () => {
      const result = createInviteSchema.safeParse({
        bookClubId: '550e8400-e29b-41d4-a716-446655440000',
        maxUses: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('inviteCodeSchema', () => {
    it('should accept 8-char code', () => {
      const result = inviteCodeSchema.safeParse({ code: 'AbCd1234' });
      expect(result.success).toBe(true);
    });

    it('should reject code of wrong length', () => {
      const result = inviteCodeSchema.safeParse({ code: 'short' });
      expect(result.success).toBe(false);
    });
  });

  describe('createEventSchema', () => {
    it('should accept valid event', () => {
      const result = createEventSchema.safeParse({
        title: 'Book Discussion',
        eventDate: '2026-03-01T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing title', () => {
      const result = createEventSchema.safeParse({
        eventDate: '2026-03-01T10:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing eventDate', () => {
      const result = createEventSchema.safeParse({
        title: 'Discussion',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional description and eventType', () => {
      const result = createEventSchema.safeParse({
        title: 'Discussion',
        description: 'We will discuss chapter 5',
        eventDate: '2026-03-01T10:00:00Z',
        eventType: 'meeting',
      });
      expect(result.success).toBe(true);
    });

    it('should reject title over 200 chars', () => {
      const result = createEventSchema.safeParse({
        title: 'a'.repeat(201),
        eventDate: '2026-03-01',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEventSchema', () => {
    it('should accept partial updates', () => {
      const result = updateEventSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateEventSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept nullable description', () => {
      const result = updateEventSchema.safeParse({ description: null });
      expect(result.success).toBe(true);
    });
  });

  describe('eventIdSchema', () => {
    it('should accept valid UUID', () => {
      const result = eventIdSchema.safeParse({
        eventId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = eventIdSchema.safeParse({ eventId: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('createRoomBodySchema', () => {
    it('should accept valid room name', () => {
      const result = createRoomBodySchema.safeParse({ name: 'general' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createRoomBodySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 chars', () => {
      const result = createRoomBodySchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('createClubSchema (new controller)', () => {
    it('should accept valid club data', () => {
      const result = createClubSchema.safeParse({
        name: 'My Club',
        description: 'A great club',
        visibility: 'PUBLIC',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all visibility values', () => {
      for (const v of ['PUBLIC', 'PRIVATE', 'INVITE_ONLY']) {
        const result = createClubSchema.safeParse({ name: 'Test', visibility: v });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid visibility', () => {
      const result = createClubSchema.safeParse({
        name: 'Test',
        visibility: 'HIDDEN',
      });
      expect(result.success).toBe(false);
    });

    it('should reject description over 500 chars', () => {
      const result = createClubSchema.safeParse({
        name: 'Test',
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateClubSchema', () => {
    it('should accept partial updates', () => {
      const result = updateClubSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept nullable imageUrl', () => {
      const result = updateClubSchema.safeParse({ imageUrl: null });
      expect(result.success).toBe(true);
    });

    it('should reject invalid imageUrl', () => {
      const result = updateClubSchema.safeParse({ imageUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });

  describe('uuidParamSchema', () => {
    it('should accept valid UUID', () => {
      const result = uuidParamSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID', () => {
      const result = uuidParamSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });
  });
});
