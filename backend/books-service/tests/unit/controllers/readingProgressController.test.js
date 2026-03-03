"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readingProgressController_1 = require("../../../src/controllers/readingProgressController");
const readingProgress_service_1 = require("../../../src/services/readingProgress.service");
jest.mock('../../../src/services/readingProgress.service');
describe('ReadingProgressController', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        mockNext = jest.fn();
        mockReq = {
            user: { userId: 'user-1', email: 'test@test.com', role: 'user' },
            query: {},
            params: { bookClubBookId: 'bcb-1' },
            body: {},
        };
        mockRes = { json: jsonMock };
        jest.clearAllMocks();
    });
    describe('getReadingProgress', () => {
        it('should return user progress', async () => {
            const progress = { id: 'rp-1', pagesRead: 50 };
            readingProgress_service_1.ReadingProgressService.getUserProgress.mockResolvedValue(progress);
            await (0, readingProgressController_1.getReadingProgress)(mockReq, mockRes, mockNext);
            expect(readingProgress_service_1.ReadingProgressService.getUserProgress).toHaveBeenCalledWith('user-1', 'bcb-1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: progress });
        });
        it('should call next(error) on failure', async () => {
            const error = new Error('not found');
            readingProgress_service_1.ReadingProgressService.getUserProgress.mockRejectedValue(error);
            await (0, readingProgressController_1.getReadingProgress)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('updateReadingProgress', () => {
        it('should update progress', async () => {
            mockReq.body = { pagesRead: 100, notes: 'Chapter 5' };
            const progress = { id: 'rp-1', pagesRead: 100, percentage: 33 };
            readingProgress_service_1.ReadingProgressService.updateProgress.mockResolvedValue(progress);
            await (0, readingProgressController_1.updateReadingProgress)(mockReq, mockRes, mockNext);
            expect(readingProgress_service_1.ReadingProgressService.updateProgress).toHaveBeenCalledWith('user-1', 'bcb-1', 100, 'Chapter 5');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: progress });
        });
        it('should call next(error) on failure', async () => {
            mockReq.body = { pagesRead: 100 };
            const error = new Error('not found');
            readingProgress_service_1.ReadingProgressService.updateProgress.mockRejectedValue(error);
            await (0, readingProgressController_1.updateReadingProgress)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('addOrUpdateReview', () => {
        it('should add/update review', async () => {
            mockReq.body = { rating: 4, reviewText: 'Great book!' };
            const review = { id: 'rv-1', rating: 4, reviewText: 'Great book!' };
            readingProgress_service_1.ReadingProgressService.addOrUpdateReview.mockResolvedValue(review);
            await (0, readingProgressController_1.addOrUpdateReview)(mockReq, mockRes, mockNext);
            expect(readingProgress_service_1.ReadingProgressService.addOrUpdateReview).toHaveBeenCalledWith('user-1', 'bcb-1', 4, 'Great book!');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: review });
        });
        it('should call next(error) on failure', async () => {
            mockReq.body = { rating: 4 };
            const error = new Error('not found');
            readingProgress_service_1.ReadingProgressService.addOrUpdateReview.mockRejectedValue(error);
            await (0, readingProgressController_1.addOrUpdateReview)(mockReq, mockRes, mockNext);
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
            readingProgress_service_1.ReadingProgressService.getReviews.mockResolvedValue(reviewData);
            await (0, readingProgressController_1.getReviews)(mockReq, mockRes, mockNext);
            expect(readingProgress_service_1.ReadingProgressService.getReviews).toHaveBeenCalledWith('bcb-1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: reviewData });
        });
        it('should call next(error) on failure', async () => {
            const error = new Error('not found');
            readingProgress_service_1.ReadingProgressService.getReviews.mockRejectedValue(error);
            await (0, readingProgressController_1.getReviews)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('deleteReview', () => {
        it('should delete review', async () => {
            readingProgress_service_1.ReadingProgressService.deleteReview.mockResolvedValue(undefined);
            await (0, readingProgressController_1.deleteReview)(mockReq, mockRes, mockNext);
            expect(readingProgress_service_1.ReadingProgressService.deleteReview).toHaveBeenCalledWith('user-1', 'bcb-1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Review deleted successfully' });
        });
        it('should call next(error) on failure', async () => {
            const error = new Error('not found');
            readingProgress_service_1.ReadingProgressService.deleteReview.mockRejectedValue(error);
            await (0, readingProgressController_1.deleteReview)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
