import joi from 'joi';

export const registerSchema = joi.object({
    name: joi.string().min(3).max(50).trim().required().messages({
        'string.min': 'Name must be at least 3 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
    }),
    email: joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required'
        })
});

export const loginSchema = joi.object({
    email: joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

// Refresh token validation
export const refreshTokenSchema = joi.object({
    refreshToken: joi.string().required().messages({
        'any.required': 'Refresh token is required'
    })
});

// Logout validation
export const logoutSchema = joi.object({
    refreshToken: joi.string().required().messages({
        'any.required': 'Refresh token is required'
    })
});

// Friend request validation
export const sendFriendRequestSchema = joi.object({
    recipientId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid recipient ID format',
        'any.required': 'Recipient ID is required'
    })
});

export const acceptFriendRequestSchema = joi.object({
    requestId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid request ID format',
        'any.required': 'Request ID is required'
    })
});

export const rejectFriendRequestSchema = joi.object({
    requestId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid request ID format',
        'any.required': 'Request ID is required'
    })
});

export const removeFriendSchema = joi.object({
    friendId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid friend ID format',
        'any.required': 'Friend ID is required'
    })
});

// Direct message validation
export const sendDirectMessageSchema = joi.object({
    receiverId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid receiver ID format',
        'any.required': 'Receiver ID is required'
    }),
    content: joi.string().max(5000).allow('').trim().messages({
        'string.max': 'Message content cannot exceed 5000 characters'
    }),
    attachments: joi.array().items(joi.object()).default([]).messages({
        'array.base': 'Attachments must be an array'
    }),
    replyToId: joi.string().uuid().allow(null).optional().messages({
        'string.guid': 'Invalid reply message ID format'
    })
}).custom((value, helpers) => {
    // At least content or attachments must be present
    if (!value.content && (!value.attachments || value.attachments.length === 0)) {
        return helpers.error('custom.contentOrAttachments');
    }
    return value;
}).messages({
    'custom.contentOrAttachments': 'Either message content or attachments are required'
});

// Profile validation
export const updateProfileSchema = joi.object({
    name: joi.string().min(3).max(50).trim().messages({
        'string.min': 'Name must be at least 3 characters long',
        'string.max': 'Name cannot exceed 50 characters'
    }),
    bio: joi.string().allow('', null).max(300).trim().messages({
        'string.max': 'Bio cannot exceed 300 characters'
    })
});

// Status validation
export const updateStatusSchema = joi.object({
    status: joi.string().valid('ONLINE', 'AWAY', 'BUSY', 'OFFLINE').required().messages({
        'any.only': 'Status must be one of: ONLINE, AWAY, BUSY, OFFLINE',
        'any.required': 'Status is required'
    })
});

// Google auth validation
export const googleAuthSchema = joi.object({
    credential: joi.string().required().messages({
        'any.required': 'Google credential is required'
    })
});

// UUID param validation
export const uuidParamSchema = joi.object({
    userId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid user ID format',
        'any.required': 'User ID is required'
    })
});

export const otherUserIdParamSchema = joi.object({
    otherUserId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid user ID format',
        'any.required': 'User ID is required'
    })
});

// Password reset validation
export const forgotPasswordSchema = joi.object({
    email: joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    })
});
// Pagination validation
export const paginationSchema = joi.object({
    page: joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    limit: joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    })
});
export const resetPasswordSchema = joi.object({
    token: joi.string().required().messages({
        'any.required': 'Reset token is required'
    }),
    password: joi.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required'
        })
});

export const changePasswordSchema = joi.object({
    currentPassword: joi.string().required().messages({
        'any.required': 'Current password is required'
    }),
    newPassword: joi.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$'))
        .required()
        .messages({
            'string.min': 'New password must be at least 8 characters long',
            'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'New password is required'
        })
});

// Email verification validation
export const verifyEmailSchema = joi.object({
    token: joi.string().required().messages({
        'any.required': 'Verification token is required'
    })
});

export const resendVerificationSchema = joi.object({
    email: joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    })
});