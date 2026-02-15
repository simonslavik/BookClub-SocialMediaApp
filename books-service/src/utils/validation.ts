import joi from 'joi';

// ========================
// User Books Schemas
// ========================

export const addBookSchema = joi.object({
  googleBooksId: joi.string().required().messages({
    'any.required': 'Google Books ID is required',
  }),
  status: joi
    .string()
    .valid('favorite', 'reading', 'want_to_read', 'completed')
    .required()
    .messages({
      'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
      'any.required': 'Status is required',
    }),
  rating: joi.number().min(1).max(5).optional().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
  review: joi.string().max(1000).optional().messages({
    'string.max': 'Review cannot exceed 1000 characters',
  }),
});

export const updateBookSchema = joi.object({
  status: joi
    .string()
    .valid('favorite', 'reading', 'want_to_read', 'completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
    }),
  rating: joi.number().min(1).max(5).optional().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
  review: joi.string().max(1000).optional().messages({
    'string.max': 'Review cannot exceed 1000 characters',
  }),
});

// ========================
// Book Club Books Schemas
// ========================

export const addBookForBookClubSchema = joi.object({
  googleBooksId: joi.string().required().messages({
    'any.required': 'Google Books ID is required',
  }),
  status: joi.string().valid('current', 'upcoming', 'completed').optional().messages({
    'any.only': 'Status must be one of: current, upcoming, completed',
  }),
  startDate: joi.date().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  endDate: joi.date().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
});

export const updateBookClubBookSchema = joi.object({
  status: joi.string().valid('current', 'upcoming', 'completed').optional().messages({
    'any.only': 'Status must be one of: current, upcoming, completed',
  }),
  startDate: joi.date().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  endDate: joi.date().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
});

export const batchCurrentBooksSchema = joi.object({
  bookClubIds: joi.array().items(joi.string().uuid()).min(1).max(50).required().messages({
    'array.base': 'bookClubIds must be an array',
    'array.min': 'bookClubIds must contain at least one ID',
    'array.max': 'bookClubIds cannot exceed 50 items',
    'any.required': 'bookClubIds is required',
  }),
});

// ========================
// Reading Progress Schemas
// ========================

export const postsBookProgressSchema = joi.object({
  pagesRead: joi.number().min(0).required().messages({
    'number.base': 'Pages read must be a number',
    'number.min': 'Pages read cannot be negative',
    'any.required': 'Pages read is required',
  }),
  notes: joi.string().max(2000).optional().messages({
    'string.max': 'Notes cannot exceed 2000 characters',
  }),
});

export const bookClubBookReviewSchema = joi.object({
  rating: joi.number().min(1).max(5).required().messages({
    'any.required': 'Rating is required',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
  reviewText: joi.string().max(2000).optional().allow('').messages({
    'string.max': 'Review cannot exceed 2000 characters',
  }),
});

// ========================
// Book Suggestions Schemas
// ========================

export const createSuggestionSchema = joi.object({
  googleBooksId: joi.string().required().messages({
    'any.required': 'Google Books ID is required',
  }),
  reason: joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Reason cannot exceed 1000 characters',
  }),
});

export const voteSuggestionSchema = joi.object({
  voteType: joi.string().valid('upvote', 'downvote').required().messages({
    'any.only': 'voteType must be either "upvote" or "downvote"',
    'any.required': 'voteType is required',
  }),
});

export const acceptSuggestionSchema = joi.object({
  startDate: joi.date().required().messages({
    'date.base': 'Start date must be a valid date',
    'any.required': 'Start date is required',
  }),
  endDate: joi.date().greater(joi.ref('startDate')).required().messages({
    'date.base': 'End date must be a valid date',
    'date.greater': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
});

// ========================
// Book Search Schemas
// ========================

export const searchQuerySchema = joi.object({
  q: joi.string().min(1).required().messages({
    'any.required': 'Query parameter "q" is required',
    'string.empty': 'Search query cannot be empty',
  }),
  limit: joi.number().integer().min(1).max(40).optional().default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 40',
  }),
});

// ========================
// Param Validation Schemas
// ========================

export const bookClubIdParamSchema = joi.object({
  bookClubId: joi.string().uuid().required().messages({
    'string.guid': 'Invalid bookClubId format',
    'any.required': 'bookClubId is required',
  }),
});

export const bookIdParamSchema = joi.object({
  bookId: joi.string().uuid().required().messages({
    'string.guid': 'Invalid bookId format',
    'any.required': 'bookId is required',
  }),
});

export const bookClubBookIdParamSchema = joi.object({
  bookClubBookId: joi.string().uuid().required().messages({
    'string.guid': 'Invalid bookClubBookId format',
    'any.required': 'bookClubBookId is required',
  }),
});

export const userBookIdParamSchema = joi.object({
  userBookId: joi.string().uuid().required().messages({
    'string.guid': 'Invalid userBookId format',
    'any.required': 'userBookId is required',
  }),
});

export const suggestionIdParamSchema = joi.object({
  suggestionId: joi.string().uuid().required().messages({
    'string.guid': 'Invalid suggestionId format',
    'any.required': 'suggestionId is required',
  }),
});

export const googleBooksIdParamSchema = joi.object({
  googleBooksId: joi.string().max(40).required().messages({
    'any.required': 'googleBooksId is required',
    'string.max': 'googleBooksId cannot exceed 40 characters',
  }),
});

// ========================
// Pagination Schema
// ========================

export const paginationSchema = joi.object({
  page: joi.number().integer().min(1).optional().default(1).messages({
    'number.min': 'Page must be at least 1',
  }),
  limit: joi.number().integer().min(1).max(100).optional().default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});
