"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.googleBooksIdParamSchema = exports.suggestionIdParamSchema = exports.userBookIdParamSchema = exports.bookClubBookIdParamSchema = exports.bookIdParamSchema = exports.bookClubIdParamSchema = exports.searchQuerySchema = exports.acceptSuggestionSchema = exports.voteSuggestionSchema = exports.createSuggestionSchema = exports.bookClubBookReviewSchema = exports.postsBookProgressSchema = exports.batchCurrentBooksSchema = exports.updateBookClubBookSchema = exports.addBookForBookClubSchema = exports.updateBookSchema = exports.addBookSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// ========================
// User Books Schemas
// ========================
exports.addBookSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().required().messages({
        'any.required': 'Google Books ID is required',
    }),
    status: joi_1.default
        .string()
        .valid('favorite', 'reading', 'want_to_read', 'completed')
        .required()
        .messages({
        'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
        'any.required': 'Status is required',
    }),
    rating: joi_1.default.number().min(1).max(5).optional().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
    }),
    review: joi_1.default.string().max(1000).optional().messages({
        'string.max': 'Review cannot exceed 1000 characters',
    }),
});
exports.updateBookSchema = joi_1.default.object({
    status: joi_1.default
        .string()
        .valid('favorite', 'reading', 'want_to_read', 'completed')
        .optional()
        .messages({
        'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
    }),
    rating: joi_1.default.number().min(1).max(5).optional().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
    }),
    review: joi_1.default.string().max(1000).optional().messages({
        'string.max': 'Review cannot exceed 1000 characters',
    }),
});
// ========================
// Book Club Books Schemas
// ========================
exports.addBookForBookClubSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().required().messages({
        'any.required': 'Google Books ID is required',
    }),
    status: joi_1.default.string().valid('current', 'upcoming', 'completed').optional().messages({
        'any.only': 'Status must be one of: current, upcoming, completed',
    }),
    startDate: joi_1.default.date().optional().messages({
        'date.base': 'Start date must be a valid date',
    }),
    endDate: joi_1.default.date().optional().messages({
        'date.base': 'End date must be a valid date',
    }),
});
exports.updateBookClubBookSchema = joi_1.default.object({
    status: joi_1.default.string().valid('current', 'upcoming', 'completed').optional().messages({
        'any.only': 'Status must be one of: current, upcoming, completed',
    }),
    startDate: joi_1.default.date().optional().messages({
        'date.base': 'Start date must be a valid date',
    }),
    endDate: joi_1.default.date().optional().messages({
        'date.base': 'End date must be a valid date',
    }),
});
exports.batchCurrentBooksSchema = joi_1.default.object({
    bookClubIds: joi_1.default.array().items(joi_1.default.string().uuid()).min(1).max(50).required().messages({
        'array.base': 'bookClubIds must be an array',
        'array.min': 'bookClubIds must contain at least one ID',
        'array.max': 'bookClubIds cannot exceed 50 items',
        'any.required': 'bookClubIds is required',
    }),
});
// ========================
// Reading Progress Schemas
// ========================
exports.postsBookProgressSchema = joi_1.default.object({
    pagesRead: joi_1.default.number().min(0).required().messages({
        'number.base': 'Pages read must be a number',
        'number.min': 'Pages read cannot be negative',
        'any.required': 'Pages read is required',
    }),
    notes: joi_1.default.string().max(2000).optional().messages({
        'string.max': 'Notes cannot exceed 2000 characters',
    }),
});
exports.bookClubBookReviewSchema = joi_1.default.object({
    rating: joi_1.default.number().min(1).max(5).required().messages({
        'any.required': 'Rating is required',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
    }),
    reviewText: joi_1.default.string().max(2000).optional().allow('').messages({
        'string.max': 'Review cannot exceed 2000 characters',
    }),
});
// ========================
// Book Suggestions Schemas
// ========================
exports.createSuggestionSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().required().messages({
        'any.required': 'Google Books ID is required',
    }),
    reason: joi_1.default.string().max(1000).optional().allow('').messages({
        'string.max': 'Reason cannot exceed 1000 characters',
    }),
});
exports.voteSuggestionSchema = joi_1.default.object({
    voteType: joi_1.default.string().valid('upvote', 'downvote').required().messages({
        'any.only': 'voteType must be either "upvote" or "downvote"',
        'any.required': 'voteType is required',
    }),
});
exports.acceptSuggestionSchema = joi_1.default.object({
    startDate: joi_1.default.date().required().messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required',
    }),
    endDate: joi_1.default.date().greater(joi_1.default.ref('startDate')).required().messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be after start date',
        'any.required': 'End date is required',
    }),
});
// ========================
// Book Search Schemas
// ========================
exports.searchQuerySchema = joi_1.default.object({
    q: joi_1.default.string().min(1).required().messages({
        'any.required': 'Query parameter "q" is required',
        'string.empty': 'Search query cannot be empty',
    }),
    limit: joi_1.default.number().integer().min(1).max(40).optional().default(20).messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 40',
    }),
});
// ========================
// Param Validation Schemas
// ========================
exports.bookClubIdParamSchema = joi_1.default.object({
    bookClubId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid bookClubId format',
        'any.required': 'bookClubId is required',
    }),
});
exports.bookIdParamSchema = joi_1.default.object({
    bookId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid bookId format',
        'any.required': 'bookId is required',
    }),
});
exports.bookClubBookIdParamSchema = joi_1.default.object({
    bookClubBookId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid bookClubBookId format',
        'any.required': 'bookClubBookId is required',
    }),
});
exports.userBookIdParamSchema = joi_1.default.object({
    userBookId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid userBookId format',
        'any.required': 'userBookId is required',
    }),
});
exports.suggestionIdParamSchema = joi_1.default.object({
    suggestionId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid suggestionId format',
        'any.required': 'suggestionId is required',
    }),
});
exports.googleBooksIdParamSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().max(40).required().messages({
        'any.required': 'googleBooksId is required',
        'string.max': 'googleBooksId cannot exceed 40 characters',
    }),
});
// ========================
// Pagination Schema
// ========================
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional().default(1).messages({
        'number.min': 'Page must be at least 1',
    }),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(20).messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
    }),
});
