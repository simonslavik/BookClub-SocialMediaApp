/**
 * Application Constants
 * Centralize magic numbers and strings for better maintainability
 */
export declare const BCRYPT_SALT_ROUNDS = 12;
export declare const DEFAULT_PAGE = 1;
export declare const DEFAULT_LIMIT = 20;
export declare const MAX_LIMIT = 100;
export declare const USER_PUBLIC_FIELDS: {
    readonly id: true;
    readonly name: true;
    readonly email: true;
    readonly profileImage: true;
    readonly createdAt: true;
};
export declare const USER_BASIC_FIELDS: {
    readonly id: true;
    readonly name: true;
    readonly email: true;
    readonly profileImage: true;
};
export declare const FriendshipStatus: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
};
export declare const LogType: {
    readonly USER_REGISTERED: "USER_REGISTERED";
    readonly USER_LOGIN: "USER_LOGIN";
    readonly USER_LOGOUT: "USER_LOGOUT";
    readonly USER_LOGOUT_ALL_DEVICES: "USER_LOGOUT_ALL_DEVICES";
    readonly REGISTRATION_FAILED: "REGISTRATION_FAILED";
    readonly LOGIN_FAILED: "LOGIN_FAILED";
    readonly TOKEN_REFRESHED: "TOKEN_REFRESHED";
    readonly REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID";
    readonly FRIEND_REQUEST_SENT: "FRIEND_REQUEST_SENT";
    readonly FRIEND_REQUEST_DUPLICATE: "FRIEND_REQUEST_DUPLICATE";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly XSS_SANITIZED: "XSS_SANITIZED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly HTTP_REQUEST: "HTTP_REQUEST";
};
export declare const ErrorMessage: {
    readonly UNAUTHORIZED: "Unauthorized";
    readonly NO_TOKEN: "No authorization token provided";
    readonly INVALID_TOKEN_FORMAT: "Invalid authorization format. Expected: Bearer <token>";
    readonly TOKEN_EXPIRED: "Token expired. Please refresh your token.";
    readonly INVALID_TOKEN: "Invalid token";
    readonly AUTH_ERROR: "Authentication error";
    readonly USER_NOT_FOUND: "User not found";
    readonly EMAIL_EXISTS: "User with this email already exists";
    readonly INVALID_CREDENTIALS: "Invalid email or password";
    readonly CANNOT_FRIEND_SELF: "Cannot send friend request to yourself";
    readonly FRIEND_REQUEST_EXISTS: "Friend request already sent";
    readonly ALREADY_FRIENDS: "Already friends";
    readonly FRIEND_REQUEST_NOT_FOUND: "Friend request not found";
    readonly FRIEND_REQUEST_NOT_PENDING: "Friend request is not pending";
    readonly ROUTE_NOT_FOUND: "Route not found";
    readonly INTERNAL_ERROR: "Internal server error";
    readonly VALIDATION_FAILED: "Validation failed";
};
export declare const SuccessMessage: {
    readonly USER_REGISTERED: "User registered successfully. Please check your email to verify your account.";
    readonly LOGIN_SUCCESS: "Login successful";
    readonly PROFILE_UPDATED: "Profile updated successfully";
    readonly TOKEN_REFRESHED: "Token refreshed successfully";
    readonly LOGOUT_SUCCESS: "Logged out successfully";
    readonly LOGOUT_ALL_SUCCESS: "Logged out from all devices successfully";
    readonly FRIEND_REQUEST_SENT: "Friend request sent successfully";
    readonly FRIEND_REQUEST_ACCEPTED: "Friend request accepted successfully";
    readonly FRIEND_REQUEST_REJECTED: "Friend request rejected successfully";
    readonly FRIEND_REMOVED: "Friend removed successfully";
    readonly MESSAGE_SENT: "Message sent successfully";
};
//# sourceMappingURL=index.d.ts.map