import {
  addBookSchema,
  updateBookSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema,
  batchCurrentBooksSchema,
  postsBookProgressSchema,
  bookClubBookReviewSchema,
  createSuggestionSchema,
  voteSuggestionSchema,
  acceptSuggestionSchema,
  searchQuerySchema,
  bookClubIdParamSchema,
  bookIdParamSchema,
  bookClubBookIdParamSchema,
  userBookIdParamSchema,
  suggestionIdParamSchema,
  googleBooksIdParamSchema,
  paginationSchema,
} from '../../src/utils/validation';

describe('Validation Schemas', () => {
  // ========================
  // User Books Schemas
  // ========================

  describe('addBookSchema', () => {
    it('should validate correct data', () => {
      const { error } = addBookSchema.validate({
        googleBooksId: 'abc123', status: 'reading', rating: 4, review: 'Great!',
      });
      expect(error).toBeUndefined();
    });

    it('should require googleBooksId', () => {
      const { error } = addBookSchema.validate({ status: 'reading' });
      expect(error?.details[0].message).toBe('Google Books ID is required');
    });

    it('should require status', () => {
      const { error } = addBookSchema.validate({ googleBooksId: 'abc' });
      expect(error?.details[0].message).toBe('Status is required');
    });

    it('should reject invalid status', () => {
      const { error } = addBookSchema.validate({ googleBooksId: 'abc', status: 'invalid' });
      expect(error?.details[0].message).toContain('Status must be one of');
    });

    it('should accept all valid statuses', () => {
      for (const status of ['favorite', 'reading', 'want_to_read', 'completed']) {
        const { error } = addBookSchema.validate({ googleBooksId: 'abc', status });
        expect(error).toBeUndefined();
      }
    });

    it('should reject rating below 1', () => {
      const { error } = addBookSchema.validate({ googleBooksId: 'abc', status: 'reading', rating: 0 });
      expect(error?.details[0].message).toBe('Rating must be at least 1');
    });

    it('should reject rating above 5', () => {
      const { error } = addBookSchema.validate({ googleBooksId: 'abc', status: 'reading', rating: 6 });
      expect(error?.details[0].message).toBe('Rating cannot exceed 5');
    });

    it('should reject review over 1000 chars', () => {
      const { error } = addBookSchema.validate({
        googleBooksId: 'abc', status: 'reading', review: 'a'.repeat(1001),
      });
      expect(error?.details[0].message).toBe('Review cannot exceed 1000 characters');
    });

    it('should allow optional rating and review', () => {
      const { error } = addBookSchema.validate({ googleBooksId: 'abc', status: 'reading' });
      expect(error).toBeUndefined();
    });
  });

  describe('updateBookSchema', () => {
    it('should allow partial updates', () => {
      const { error } = updateBookSchema.validate({ rating: 5 });
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = updateBookSchema.validate({ status: 'invalid' });
      expect(error).toBeDefined();
    });

    it('should reject rating below 1', () => {
      const { error } = updateBookSchema.validate({ rating: 0 });
      expect(error?.details[0].message).toBe('Rating must be at least 1');
    });
  });

  // ========================
  // Book Club Books Schemas
  // ========================

  describe('addBookForBookClubSchema', () => {
    it('should validate correct data', () => {
      const { error } = addBookForBookClubSchema.validate({
        googleBooksId: 'abc', status: 'current', startDate: new Date(), endDate: new Date(),
      });
      expect(error).toBeUndefined();
    });

    it('should require googleBooksId', () => {
      const { error } = addBookForBookClubSchema.validate({ status: 'current' });
      expect(error).toBeDefined();
    });

    it('should accept valid bookclub statuses', () => {
      for (const status of ['current', 'upcoming', 'completed']) {
        const { error } = addBookForBookClubSchema.validate({ googleBooksId: 'abc', status });
        expect(error).toBeUndefined();
      }
    });

    it('should reject user book statuses', () => {
      const { error } = addBookForBookClubSchema.validate({ googleBooksId: 'abc', status: 'reading' });
      expect(error?.details[0].message).toContain('Status must be one of: current, upcoming, completed');
    });

    it('should allow optional dates and status', () => {
      const { error } = addBookForBookClubSchema.validate({ googleBooksId: 'abc' });
      expect(error).toBeUndefined();
    });
  });

  describe('updateBookClubBookSchema', () => {
    it('should allow partial updates', () => {
      const { error } = updateBookClubBookSchema.validate({ status: 'completed' });
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = updateBookClubBookSchema.validate({ status: 'reading' });
      expect(error).toBeDefined();
    });

    it('should reject invalid date', () => {
      const { error } = updateBookClubBookSchema.validate({ startDate: 'not-a-date' });
      expect(error?.details[0].message).toBe('Start date must be a valid date');
    });
  });

  describe('batchCurrentBooksSchema', () => {
    it('should validate array of UUIDs', () => {
      const { error } = batchCurrentBooksSchema.validate({
        bookClubIds: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(error).toBeUndefined();
    });

    it('should require bookClubIds', () => {
      const { error } = batchCurrentBooksSchema.validate({});
      expect(error?.details[0].message).toBe('bookClubIds is required');
    });

    it('should require at least one ID', () => {
      const { error } = batchCurrentBooksSchema.validate({ bookClubIds: [] });
      expect(error?.details[0].message).toBe('bookClubIds must contain at least one ID');
    });

    it('should reject more than 50 IDs', () => {
      const ids = Array.from({ length: 51 }, (_, i) => `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`);
      const { error } = batchCurrentBooksSchema.validate({ bookClubIds: ids });
      expect(error?.details[0].message).toBe('bookClubIds cannot exceed 50 items');
    });

    it('should reject non-UUID strings', () => {
      const { error } = batchCurrentBooksSchema.validate({ bookClubIds: ['not-a-uuid'] });
      expect(error).toBeDefined();
    });
  });

  // ========================
  // Reading Progress Schemas
  // ========================

  describe('postsBookProgressSchema', () => {
    it('should validate correct data', () => {
      const { error } = postsBookProgressSchema.validate({ pagesRead: 50, notes: 'Chapter 3' });
      expect(error).toBeUndefined();
    });

    it('should require pagesRead', () => {
      const { error } = postsBookProgressSchema.validate({ notes: 'test' });
      expect(error?.details[0].message).toBe('Pages read is required');
    });

    it('should reject negative pagesRead', () => {
      const { error } = postsBookProgressSchema.validate({ pagesRead: -1 });
      expect(error?.details[0].message).toBe('Pages read cannot be negative');
    });

    it('should allow 0 pagesRead', () => {
      const { error } = postsBookProgressSchema.validate({ pagesRead: 0 });
      expect(error).toBeUndefined();
    });

    it('should reject notes over 2000 chars', () => {
      const { error } = postsBookProgressSchema.validate({ pagesRead: 1, notes: 'a'.repeat(2001) });
      expect(error?.details[0].message).toBe('Notes cannot exceed 2000 characters');
    });
  });

  describe('bookClubBookReviewSchema', () => {
    it('should validate correct data', () => {
      const { error } = bookClubBookReviewSchema.validate({ rating: 4, reviewText: 'Great!' });
      expect(error).toBeUndefined();
    });

    it('should require rating', () => {
      const { error } = bookClubBookReviewSchema.validate({ reviewText: 'test' });
      expect(error?.details[0].message).toBe('Rating is required');
    });

    it('should reject rating below 1', () => {
      const { error } = bookClubBookReviewSchema.validate({ rating: 0 });
      expect(error?.details[0].message).toBe('Rating must be at least 1');
    });

    it('should reject rating above 5', () => {
      const { error } = bookClubBookReviewSchema.validate({ rating: 6 });
      expect(error?.details[0].message).toBe('Rating cannot exceed 5');
    });

    it('should allow empty reviewText', () => {
      const { error } = bookClubBookReviewSchema.validate({ rating: 4, reviewText: '' });
      expect(error).toBeUndefined();
    });

    it('should reject reviewText over 2000 chars', () => {
      const { error } = bookClubBookReviewSchema.validate({ rating: 4, reviewText: 'a'.repeat(2001) });
      expect(error?.details[0].message).toBe('Review cannot exceed 2000 characters');
    });
  });

  // ========================
  // Book Suggestions Schemas
  // ========================

  describe('createSuggestionSchema', () => {
    it('should validate correct data', () => {
      const { error } = createSuggestionSchema.validate({ googleBooksId: 'abc', reason: 'Great book!' });
      expect(error).toBeUndefined();
    });

    it('should require googleBooksId', () => {
      const { error } = createSuggestionSchema.validate({ reason: 'test' });
      expect(error?.details[0].message).toBe('Google Books ID is required');
    });

    it('should allow empty reason', () => {
      const { error } = createSuggestionSchema.validate({ googleBooksId: 'abc', reason: '' });
      expect(error).toBeUndefined();
    });

    it('should reject reason over 1000 chars', () => {
      const { error } = createSuggestionSchema.validate({ googleBooksId: 'abc', reason: 'a'.repeat(1001) });
      expect(error?.details[0].message).toBe('Reason cannot exceed 1000 characters');
    });
  });

  describe('voteSuggestionSchema', () => {
    it('should accept upvote', () => {
      const { error } = voteSuggestionSchema.validate({ voteType: 'upvote' });
      expect(error).toBeUndefined();
    });

    it('should accept downvote', () => {
      const { error } = voteSuggestionSchema.validate({ voteType: 'downvote' });
      expect(error).toBeUndefined();
    });

    it('should require voteType', () => {
      const { error } = voteSuggestionSchema.validate({});
      expect(error?.details[0].message).toBe('voteType is required');
    });

    it('should reject invalid voteType', () => {
      const { error } = voteSuggestionSchema.validate({ voteType: 'neutral' });
      expect(error?.details[0].message).toContain('voteType must be either');
    });
  });

  describe('acceptSuggestionSchema', () => {
    it('should validate correct data', () => {
      const { error } = acceptSuggestionSchema.validate({
        startDate: new Date(), endDate: new Date(),
      });
      expect(error).toBeUndefined();
    });

    it('should require startDate', () => {
      const { error } = acceptSuggestionSchema.validate({ endDate: new Date() });
      expect(error?.details[0].message).toBe('Start date is required');
    });

    it('should require endDate', () => {
      const { error } = acceptSuggestionSchema.validate({ startDate: new Date() });
      expect(error?.details[0].message).toBe('End date is required');
    });

    it('should reject invalid date', () => {
      const { error } = acceptSuggestionSchema.validate({ startDate: 'not-a-date', endDate: new Date() });
      expect(error?.details[0].message).toBe('Start date must be a valid date');
    });
  });

  // ========================
  // Book Search Schema
  // ========================

  describe('searchQuerySchema', () => {
    it('should validate correct query', () => {
      const { error } = searchQuerySchema.validate({ q: 'typescript' });
      expect(error).toBeUndefined();
    });

    it('should require q', () => {
      const { error } = searchQuerySchema.validate({});
      expect(error?.details[0].message).toBe('Query parameter "q" is required');
    });

    it('should reject empty q', () => {
      const { error } = searchQuerySchema.validate({ q: '' });
      expect(error?.details[0].message).toBe('Search query cannot be empty');
    });

    it('should default limit to 20', () => {
      const { value } = searchQuerySchema.validate({ q: 'test' });
      expect(value.limit).toBe(20);
    });

    it('should reject limit over 40', () => {
      const { error } = searchQuerySchema.validate({ q: 'test', limit: 41 });
      expect(error?.details[0].message).toBe('Limit cannot exceed 40');
    });

    it('should reject limit below 1', () => {
      const { error } = searchQuerySchema.validate({ q: 'test', limit: 0 });
      expect(error?.details[0].message).toBe('Limit must be at least 1');
    });
  });

  // ========================
  // Param Schemas
  // ========================

  describe('bookClubIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = bookClubIdParamSchema.validate({
        bookClubId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-UUID', () => {
      const { error } = bookClubIdParamSchema.validate({ bookClubId: 'not-a-uuid' });
      expect(error?.details[0].message).toBe('Invalid bookClubId format');
    });

    it('should require bookClubId', () => {
      const { error } = bookClubIdParamSchema.validate({});
      expect(error?.details[0].message).toBe('bookClubId is required');
    });
  });

  describe('bookIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = bookIdParamSchema.validate({
        bookId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-UUID', () => {
      const { error } = bookIdParamSchema.validate({ bookId: 'invalid' });
      expect(error?.details[0].message).toBe('Invalid bookId format');
    });
  });

  describe('bookClubBookIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = bookClubBookIdParamSchema.validate({
        bookClubBookId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-UUID', () => {
      const { error } = bookClubBookIdParamSchema.validate({ bookClubBookId: 'invalid' });
      expect(error?.details[0].message).toBe('Invalid bookClubBookId format');
    });
  });

  describe('userBookIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = userBookIdParamSchema.validate({
        userBookId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-UUID', () => {
      const { error } = userBookIdParamSchema.validate({ userBookId: 'invalid' });
      expect(error?.details[0].message).toBe('Invalid userBookId format');
    });
  });

  describe('suggestionIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const { error } = suggestionIdParamSchema.validate({
        suggestionId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-UUID', () => {
      const { error } = suggestionIdParamSchema.validate({ suggestionId: 'invalid' });
      expect(error?.details[0].message).toBe('Invalid suggestionId format');
    });
  });

  describe('googleBooksIdParamSchema', () => {
    it('should accept valid ID', () => {
      const { error } = googleBooksIdParamSchema.validate({ googleBooksId: 'abc123' });
      expect(error).toBeUndefined();
    });

    it('should reject ID over 40 chars', () => {
      const { error } = googleBooksIdParamSchema.validate({ googleBooksId: 'a'.repeat(41) });
      expect(error?.details[0].message).toBe('googleBooksId cannot exceed 40 characters');
    });

    it('should require googleBooksId', () => {
      const { error } = googleBooksIdParamSchema.validate({});
      expect(error?.details[0].message).toBe('googleBooksId is required');
    });
  });

  // ========================
  // Pagination Schema
  // ========================

  describe('paginationSchema', () => {
    it('should provide defaults', () => {
      const { value, error } = paginationSchema.validate({});
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 1, limit: 20 });
    });

    it('should accept custom values', () => {
      const { value, error } = paginationSchema.validate({ page: 5, limit: 50 });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 5, limit: 50 });
    });

    it('should reject page below 1', () => {
      const { error } = paginationSchema.validate({ page: 0 });
      expect(error?.details[0].message).toBe('Page must be at least 1');
    });

    it('should reject limit above 100', () => {
      const { error } = paginationSchema.validate({ limit: 101 });
      expect(error?.details[0].message).toBe('Limit cannot exceed 100');
    });

    it('should reject limit below 1', () => {
      const { error } = paginationSchema.validate({ limit: 0 });
      expect(error?.details[0].message).toBe('Limit must be at least 1');
    });
  });
});
