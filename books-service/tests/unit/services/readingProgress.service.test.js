"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readingProgress_service_1 = require("../../../src/services/readingProgress.service");
const readingProgress_repository_1 = require("../../../src/repositories/readingProgress.repository");
const bookClubBooks_repository_1 = require("../../../src/repositories/bookClubBooks.repository");
const bookClubReviews_repository_1 = require("../../../src/repositories/bookClubReviews.repository");
const errors_1 = require("../../../src/utils/errors");
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
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            readingProgress_repository_1.ReadingProgressRepository.findUserProgress.mockResolvedValue(progress);
            const result = await readingProgress_service_1.ReadingProgressService.getUserProgress('user-1', 'bcb-1');
            expect(result).toEqual(progress);
        });
        it('should run findById and findUserProgress in parallel', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            readingProgress_repository_1.ReadingProgressRepository.findUserProgress.mockResolvedValue(null);
            await readingProgress_service_1.ReadingProgressService.getUserProgress('user-1', 'bcb-1');
            // Both should be called (parallel via Promise.all)
            expect(bookClubBooks_repository_1.BookClubBooksRepository.findById).toHaveBeenCalledWith('bcb-1');
            expect(readingProgress_repository_1.ReadingProgressRepository.findUserProgress).toHaveBeenCalledWith('user-1', 'bcb-1');
        });
        it('should throw NotFoundError when bookclub book does not exist', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue(null);
            readingProgress_repository_1.ReadingProgressRepository.findUserProgress.mockResolvedValue(null);
            await expect(readingProgress_service_1.ReadingProgressService.getUserProgress('user-1', 'bcb-1')).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('updateProgress', () => {
        it('should update progress and return with percentage', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({
                id: 'bcb-1',
                book: { pageCount: 300 },
            });
            const progress = { id: 'rp-1', pagesRead: 150, notes: null };
            readingProgress_repository_1.ReadingProgressRepository.upsertProgress.mockResolvedValue(progress);
            const result = await readingProgress_service_1.ReadingProgressService.updateProgress('user-1', 'bcb-1', 150);
            expect(readingProgress_repository_1.ReadingProgressRepository.upsertProgress).toHaveBeenCalledWith('user-1', 'bcb-1', {
                pagesRead: 150,
                notes: null,
            });
            expect(result).toEqual({ ...progress, percentage: 50 });
        });
        it('should default to 100 page count when book has null pageCount', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({
                id: 'bcb-1',
                book: { pageCount: null },
            });
            readingProgress_repository_1.ReadingProgressRepository.upsertProgress.mockResolvedValue({
                id: 'rp-1',
                pagesRead: 50,
            });
            const result = await readingProgress_service_1.ReadingProgressService.updateProgress('user-1', 'bcb-1', 50);
            expect(result.percentage).toBe(50);
        });
        it('should cap percentage at 100', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({
                id: 'bcb-1',
                book: { pageCount: 200 },
            });
            readingProgress_repository_1.ReadingProgressRepository.upsertProgress.mockResolvedValue({
                id: 'rp-1',
                pagesRead: 300,
            });
            const result = await readingProgress_service_1.ReadingProgressService.updateProgress('user-1', 'bcb-1', 300);
            expect(result.percentage).toBe(100);
        });
        it('should pass notes through', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({
                id: 'bcb-1',
                book: { pageCount: 200 },
            });
            readingProgress_repository_1.ReadingProgressRepository.upsertProgress.mockResolvedValue({ id: 'rp-1', pagesRead: 50 });
            await readingProgress_service_1.ReadingProgressService.updateProgress('user-1', 'bcb-1', 50, 'Chapter 3');
            expect(readingProgress_repository_1.ReadingProgressRepository.upsertProgress).toHaveBeenCalledWith('user-1', 'bcb-1', {
                pagesRead: 50,
                notes: 'Chapter 3',
            });
        });
        it('should throw NotFoundError when bookclub book does not exist', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue(null);
            await expect(readingProgress_service_1.ReadingProgressService.updateProgress('user-1', 'bcb-1', 50)).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('getReviews', () => {
        it('should return reviews with average rating and total count', async () => {
            const reviews = [
                { id: 'rv-1', rating: 4 },
                { id: 'rv-2', rating: 5 },
                { id: 'rv-3', rating: 3 },
            ];
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            bookClubReviews_repository_1.BookClubReviewsRepository.findByBookClubBook.mockResolvedValue(reviews);
            const result = await readingProgress_service_1.ReadingProgressService.getReviews('bcb-1');
            expect(result.reviews).toEqual(reviews);
            expect(result.averageRating).toBe(4);
            expect(result.totalReviews).toBe(3);
        });
        it('should return 0 average when no reviews', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            bookClubReviews_repository_1.BookClubReviewsRepository.findByBookClubBook.mockResolvedValue([]);
            const result = await readingProgress_service_1.ReadingProgressService.getReviews('bcb-1');
            expect(result.averageRating).toBe(0);
            expect(result.totalReviews).toBe(0);
        });
        it('should round average to 1 decimal place', async () => {
            const reviews = [{ rating: 4 }, { rating: 5 }, { rating: 4 }];
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            bookClubReviews_repository_1.BookClubReviewsRepository.findByBookClubBook.mockResolvedValue(reviews);
            const result = await readingProgress_service_1.ReadingProgressService.getReviews('bcb-1');
            expect(result.averageRating).toBe(4.3);
        });
        it('should throw NotFoundError when bookclub book does not exist', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue(null);
            bookClubReviews_repository_1.BookClubReviewsRepository.findByBookClubBook.mockResolvedValue([]);
            await expect(readingProgress_service_1.ReadingProgressService.getReviews('bcb-1')).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('addOrUpdateReview', () => {
        it('should create/update review', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            const review = { id: 'rv-1', rating: 4, reviewText: 'Great!' };
            bookClubReviews_repository_1.BookClubReviewsRepository.upsert.mockResolvedValue(review);
            const result = await readingProgress_service_1.ReadingProgressService.addOrUpdateReview('user-1', 'bcb-1', 4, 'Great!');
            expect(bookClubReviews_repository_1.BookClubReviewsRepository.upsert).toHaveBeenCalledWith('user-1', 'bcb-1', {
                rating: 4,
                reviewText: 'Great!',
            });
            expect(result).toEqual(review);
        });
        it('should set reviewText to null when not provided', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue({ id: 'bcb-1' });
            bookClubReviews_repository_1.BookClubReviewsRepository.upsert.mockResolvedValue({});
            await readingProgress_service_1.ReadingProgressService.addOrUpdateReview('user-1', 'bcb-1', 4);
            expect(bookClubReviews_repository_1.BookClubReviewsRepository.upsert).toHaveBeenCalledWith('user-1', 'bcb-1', {
                rating: 4,
                reviewText: null,
            });
        });
        it('should throw NotFoundError when bookclub book does not exist', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findById.mockResolvedValue(null);
            await expect(readingProgress_service_1.ReadingProgressService.addOrUpdateReview('user-1', 'bcb-1', 4)).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('deleteReview', () => {
        it('should delete review', async () => {
            bookClubReviews_repository_1.BookClubReviewsRepository.delete.mockResolvedValue(undefined);
            await readingProgress_service_1.ReadingProgressService.deleteReview('user-1', 'bcb-1');
            expect(bookClubReviews_repository_1.BookClubReviewsRepository.delete).toHaveBeenCalledWith('user-1', 'bcb-1');
        });
    });
});
