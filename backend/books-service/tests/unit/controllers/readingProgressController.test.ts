import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../src/middleware/authMiddleware';
import {
  getReadingProgress,
  updateReadingProgress,
  addOrUpdateReview,
  getReviews,
  deleteReview,
} from '../../../src/controllers/readingProgressController';
import { ReadingProgressService } from '../../../src/services/readingProgress.service';

jest.mock('../../../src/services/readingProgress.service');

describe('ReadingProgressController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockNext = jest.fn();
    mockReq = {
      user: { userId: 'user-1', email: 'test@test.com', role: 'user' },
      query: {},
      params: { bookClubBookId: 'bcb-1' },
      body: {},
    };
    mockRes = { json: jsonMock } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('getReadingProgress', () => {
    it('should return user progress', async () => {
      const progress = { id: 'rp-1', pagesRead: 50 };
      (ReadingProgressService.getUserProgress as jest.Mock).mockResolvedValue(progress);

      await getReadingProgress(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(ReadingProgressService.getUserProgress).toHaveBeenCalledWith('user-1', 'bcb-1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: progress });
    });

    it('should call next(error) on failure', async () => {
      const error = new Error('not found');
      (ReadingProgressService.getUserProgress as jest.Mock).mockRejectedValue(error);

      await getReadingProgress(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateReadingProgress', () => {
    it('should update progress', async () => {
      mockReq.body = { pagesRead: 100, notes: 'Chapter 5' };
      const progress = { id: 'rp-1', pagesRead: 100, percentage: 33 };
      (ReadingProgressService.updateProgress as jest.Mock).mockResolvedValue(progress);

      await updateReadingProgress(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(ReadingProgressService.updateProgress).toHaveBeenCalledWith('user-1', 'bcb-1', 100, 'Chapter 5');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: progress });
    });

    it('should call next(error) on failure', async () => {
      mockReq.body = { pagesRead: 100 };
      const error = new Error('not found');
      (ReadingProgressService.updateProgress as jest.Mock).mockRejectedValue(error);

      await updateReadingProgress(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addOrUpdateReview', () => {
    it('should add/update review', async () => {
      mockReq.body = { rating: 4, reviewText: 'Great book!' };
      const review = { id: 'rv-1', rating: 4, reviewText: 'Great book!' };
      (ReadingProgressService.addOrUpdateReview as jest.Mock).mockResolvedValue(review);

      await addOrUpdateReview(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(ReadingProgressService.addOrUpdateReview).toHaveBeenCalledWith('user-1', 'bcb-1', 4, 'Great book!');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: review });
    });

    it('should call next(error) on failure', async () => {
      mockReq.body = { rating: 4 };
      const error = new Error('not found');
      (ReadingProgressService.addOrUpdateReview as jest.Mock).mockRejectedValue(error);

      await addOrUpdateReview(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getReviews', () => {
    it('should return reviews with stats', async () => {
      const reviewData = {
        reviews: [{ id: 'rv-1', rating: 4 }],
        averageRating: 4,
        totalReviews: 1,
      };
      (ReadingProgressService.getReviews as jest.Mock).mockResolvedValue(reviewData);

      await getReviews(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(ReadingProgressService.getReviews).toHaveBeenCalledWith('bcb-1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: reviewData });
    });

    it('should call next(error) on failure', async () => {
      const error = new Error('not found');
      (ReadingProgressService.getReviews as jest.Mock).mockRejectedValue(error);

      await getReviews(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteReview', () => {
    it('should delete review', async () => {
      (ReadingProgressService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      await deleteReview(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(ReadingProgressService.deleteReview).toHaveBeenCalledWith('user-1', 'bcb-1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Review deleted successfully' });
    });

    it('should call next(error) on failure', async () => {
      const error = new Error('not found');
      (ReadingProgressService.deleteReview as jest.Mock).mockRejectedValue(error);

      await deleteReview(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
