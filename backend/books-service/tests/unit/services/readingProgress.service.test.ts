import { ReadingProgressService } from '../../../src/services/readingProgress.service';
import { ReadingProgressRepository } from '../../../src/repositories/readingProgress.repository';
import { BookClubBooksRepository } from '../../../src/repositories/bookClubBooks.repository';
import { BookClubReviewsRepository } from '../../../src/repositories/bookClubReviews.repository';
import { NotFoundError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories/readingProgress.repository');
jest.mock('../../../src/repositories/bookClubBooks.repository');
jest.mock('../../../src/repositories/bookClubReviews.repository');
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('ReadingProgressService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getUserProgress', () => {
    it('should return progress when bookclub book exists', async () => {
      const progress = { id: 'rp-1', pagesRead: 50 };
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (ReadingProgressRepository.findUserProgress as jest.Mock).mockResolvedValue(progress);

      const result = await ReadingProgressService.getUserProgress('user-1', 'bcb-1');

      expect(result).toEqual(progress);
    });

    it('should run findById and findUserProgress in parallel', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (ReadingProgressRepository.findUserProgress as jest.Mock).mockResolvedValue(null);

      await ReadingProgressService.getUserProgress('user-1', 'bcb-1');

      // Both should be called (parallel via Promise.all)
      expect(BookClubBooksRepository.findById).toHaveBeenCalledWith('bcb-1');
      expect(ReadingProgressRepository.findUserProgress).toHaveBeenCalledWith('user-1', 'bcb-1');
    });

    it('should throw NotFoundError when bookclub book does not exist', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue(null);
      (ReadingProgressRepository.findUserProgress as jest.Mock).mockResolvedValue(null);

      await expect(ReadingProgressService.getUserProgress('user-1', 'bcb-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProgress', () => {
    it('should update progress and return with percentage', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({
        id: 'bcb-1',
        book: { pageCount: 300 },
      });
      const progress = { id: 'rp-1', pagesRead: 150, notes: null };
      (ReadingProgressRepository.upsertProgress as jest.Mock).mockResolvedValue(progress);

      const result = await ReadingProgressService.updateProgress('user-1', 'bcb-1', 150);

      expect(ReadingProgressRepository.upsertProgress).toHaveBeenCalledWith('user-1', 'bcb-1', {
        pagesRead: 150,
        notes: null,
      });
      expect(result).toEqual({ ...progress, percentage: 50 });
    });

    it('should default to 100 page count when book has null pageCount', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({
        id: 'bcb-1',
        book: { pageCount: null },
      });
      (ReadingProgressRepository.upsertProgress as jest.Mock).mockResolvedValue({
        id: 'rp-1',
        pagesRead: 50,
      });

      const result = await ReadingProgressService.updateProgress('user-1', 'bcb-1', 50);

      expect(result.percentage).toBe(50);
    });

    it('should cap percentage at 100', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({
        id: 'bcb-1',
        book: { pageCount: 200 },
      });
      (ReadingProgressRepository.upsertProgress as jest.Mock).mockResolvedValue({
        id: 'rp-1',
        pagesRead: 300,
      });

      const result = await ReadingProgressService.updateProgress('user-1', 'bcb-1', 300);

      expect(result.percentage).toBe(100);
    });

    it('should pass notes through', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({
        id: 'bcb-1',
        book: { pageCount: 200 },
      });
      (ReadingProgressRepository.upsertProgress as jest.Mock).mockResolvedValue({ id: 'rp-1', pagesRead: 50 });

      await ReadingProgressService.updateProgress('user-1', 'bcb-1', 50, 'Chapter 3');

      expect(ReadingProgressRepository.upsertProgress).toHaveBeenCalledWith('user-1', 'bcb-1', {
        pagesRead: 50,
        notes: 'Chapter 3',
      });
    });

    it('should throw NotFoundError when bookclub book does not exist', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(ReadingProgressService.updateProgress('user-1', 'bcb-1', 50)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getReviews', () => {
    it('should return reviews with average rating and total count', async () => {
      const reviews = [
        { id: 'rv-1', rating: 4 },
        { id: 'rv-2', rating: 5 },
        { id: 'rv-3', rating: 3 },
      ];
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (BookClubReviewsRepository.findByBookClubBook as jest.Mock).mockResolvedValue(reviews);

      const result = await ReadingProgressService.getReviews('bcb-1');

      expect(result.reviews).toEqual(reviews);
      expect(result.averageRating).toBe(4);
      expect(result.totalReviews).toBe(3);
    });

    it('should return 0 average when no reviews', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (BookClubReviewsRepository.findByBookClubBook as jest.Mock).mockResolvedValue([]);

      const result = await ReadingProgressService.getReviews('bcb-1');

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });

    it('should round average to 1 decimal place', async () => {
      const reviews = [{ rating: 4 }, { rating: 5 }, { rating: 4 }];
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (BookClubReviewsRepository.findByBookClubBook as jest.Mock).mockResolvedValue(reviews);

      const result = await ReadingProgressService.getReviews('bcb-1');

      expect(result.averageRating).toBe(4.3);
    });

    it('should throw NotFoundError when bookclub book does not exist', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue(null);
      (BookClubReviewsRepository.findByBookClubBook as jest.Mock).mockResolvedValue([]);

      await expect(ReadingProgressService.getReviews('bcb-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('addOrUpdateReview', () => {
    it('should create/update review', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      const review = { id: 'rv-1', rating: 4, reviewText: 'Great!' };
      (BookClubReviewsRepository.upsert as jest.Mock).mockResolvedValue(review);

      const result = await ReadingProgressService.addOrUpdateReview('user-1', 'bcb-1', 4, 'Great!');

      expect(BookClubReviewsRepository.upsert).toHaveBeenCalledWith('user-1', 'bcb-1', {
        rating: 4,
        reviewText: 'Great!',
      });
      expect(result).toEqual(review);
    });

    it('should set reviewText to null when not provided', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (BookClubReviewsRepository.upsert as jest.Mock).mockResolvedValue({});

      await ReadingProgressService.addOrUpdateReview('user-1', 'bcb-1', 4);

      expect(BookClubReviewsRepository.upsert).toHaveBeenCalledWith('user-1', 'bcb-1', {
        rating: 4,
        reviewText: null,
      });
    });

    it('should throw NotFoundError when bookclub book does not exist', async () => {
      (BookClubBooksRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        ReadingProgressService.addOrUpdateReview('user-1', 'bcb-1', 4)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteReview', () => {
    it('should delete review', async () => {
      (BookClubReviewsRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await ReadingProgressService.deleteReview('user-1', 'bcb-1');

      expect(BookClubReviewsRepository.delete).toHaveBeenCalledWith('user-1', 'bcb-1');
    });
  });
});
