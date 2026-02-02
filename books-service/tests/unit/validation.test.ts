import {
  addBookSchema,
  updateBookSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema
} from '../../utils/validation';

describe('Validation Schemas', () => {
  describe('addBookSchema', () => {
    it('should validate correct book data', () => {
      const validData = {
        googleBooksId: 'abc123',
        status: 'reading',
        rating: 4,
        review: 'Great book!'
      };

      const { error, value } = addBookSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should require googleBooksId', () => {
      const invalidData = {
        status: 'reading'
      };

      const { error } = addBookSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Google Books ID is required');
    });

    it('should require status', () => {
      const invalidData = {
        googleBooksId: 'abc123'
      };

      const { error } = addBookSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Status is required');
    });

    it('should validate status values', () => {
      const invalidData = {
        googleBooksId: 'abc123',
        status: 'invalid_status'
      };

      const { error } = addBookSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Status must be one of');
    });

    it('should validate rating range', () => {
      const invalidData = {
        googleBooksId: 'abc123',
        status: 'reading',
        rating: 6
      };

      const { error } = addBookSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Rating cannot exceed 5');
    });

    it('should validate review length', () => {
      const invalidData = {
        googleBooksId: 'abc123',
        status: 'reading',
        review: 'a'.repeat(1001)
      };

      const { error } = addBookSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Review cannot exceed 1000 characters');
    });

    it('should allow optional rating and review', () => {
      const validData = {
        googleBooksId: 'abc123',
        status: 'reading'
      };

      const { error } = addBookSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('updateBookSchema', () => {
    it('should validate update with all fields', () => {
      const validData = {
        status: 'completed',
        rating: 5,
        review: 'Excellent!'
      };

      const { error } = updateBookSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should allow partial updates', () => {
      const validData = {
        status: 'reading'
      };

      const { error } = updateBookSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate rating in updates', () => {
      const invalidData = {
        rating: 0
      };

      const { error } = updateBookSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Rating must be at least 1');
    });
  });

  describe('addBookForBookClubSchema', () => {
    it('should validate bookclub book data', () => {
      const validData = {
        googleBooksId: 'abc123',
        status: 'current',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-01')
      };

      const { error } = addBookForBookClubSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should require googleBooksId', () => {
      const invalidData = {
        status: 'current'
      };

      const { error } = addBookForBookClubSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should validate status values for bookclub', () => {
      const invalidData = {
        googleBooksId: 'abc123',
        status: 'reading' // Not valid for bookclub
      };

      const { error } = addBookForBookClubSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Status must be one of: current, upcoming, completed');
    });

    it('should allow optional dates', () => {
      const validData = {
        googleBooksId: 'abc123'
      };

      const { error } = addBookForBookClubSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });
});
