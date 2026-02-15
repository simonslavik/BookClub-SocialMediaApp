/**
 * Application Constants
 * Centralize magic numbers and strings for better maintainability
 */

// Password hashing
export const BCRYPT_SALT_ROUNDS = 12;

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// User selection fields (commonly used projections)
export const USER_PUBLIC_FIELDS = {
    id: true,
    name: true,
    email: true,
    profileImage: true,
    emailVerified: true,
    createdAt: true
} as const;

export const USER_BASIC_FIELDS = {
    id: true,
    name: true,
    email: true,
    profileImage: true
} as const;

// Friendship statuses
export const FriendshipStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED'
} as const;

// Log types
export const LogType = {
    // User events
    USER_REGISTERED: 'USER_REGISTERED',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    USER_LOGOUT_ALL_DEVICES: 'USER_LOGOUT_ALL_DEVICES',
    
    // Registration/Login failures
    REGISTRATION_FAILED: 'REGISTRATION_FAILED',
    LOGIN_FAILED: 'LOGIN_FAILED',
    
    // Token events
    TOKEN_REFRESHED: 'TOKEN_REFRESHED',
    REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
    
    // Friendship events
    FRIEND_REQUEST_SENT: 'FRIEND_REQUEST_SENT',
    FRIEND_REQUEST_DUPLICATE: 'FRIEND_REQUEST_DUPLICATE',
    
    // Errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    XSS_SANITIZED: 'XSS_SANITIZED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // HTTP
    HTTP_REQUEST: 'HTTP_REQUEST'
} as const;

// Error messages
export const ErrorMessage = {
    // Auth
    UNAUTHORIZED: 'Unauthorized',
    NO_TOKEN: 'No authorization token provided',
    INVALID_TOKEN_FORMAT: 'Invalid authorization format. Expected: Bearer <token>',
    TOKEN_EXPIRED: 'Token expired. Please refresh your token.',
    INVALID_TOKEN: 'Invalid token',
    AUTH_ERROR: 'Authentication error',
    
    // User
    USER_NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'User with this email already exists',
    INVALID_CREDENTIALS: 'Invalid email or password',
    
    // Friends
    CANNOT_FRIEND_SELF: 'Cannot send friend request to yourself',
    FRIEND_REQUEST_EXISTS: 'Friend request already sent',
    ALREADY_FRIENDS: 'Already friends',
    FRIEND_REQUEST_NOT_FOUND: 'Friend request not found',
    FRIEND_REQUEST_NOT_PENDING: 'Friend request is not pending',
    
    // Generic
    ROUTE_NOT_FOUND: 'Route not found',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_FAILED: 'Validation failed'
} as const;

// Success messages
export const SuccessMessage = {
    // User
    USER_REGISTERED: 'User registered successfully. Please check your email to verify your account.',
    LOGIN_SUCCESS: 'Login successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    
    // Token
    TOKEN_REFRESHED: 'Token refreshed successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    LOGOUT_ALL_SUCCESS: 'Logged out from all devices successfully',
    
    // Friends
    FRIEND_REQUEST_SENT: 'Friend request sent successfully',
    FRIEND_REQUEST_ACCEPTED: 'Friend request accepted successfully',
    FRIEND_REQUEST_REJECTED: 'Friend request rejected successfully',
    FRIEND_REMOVED: 'Friend removed successfully',
    
    // Messages
    MESSAGE_SENT: 'Message sent successfully'
} as const;
