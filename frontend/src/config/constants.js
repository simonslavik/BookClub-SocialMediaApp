// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001';
export const COLLAB_EDITOR_URL = import.meta.env.VITE_COLLAB_EDITOR_URL || 'http://localhost:4000';

/**
 * Resolve an image URL that may be either:
 * - An absolute URL (e.g. Google profile pic: https://lh3.googleusercontent.com/...)
 * - A relative path (e.g. /uploads/profile-images/uuid.jpg)
 * Returns the URL as-is if absolute, or prefixes with the given base URL.
 */
export const resolveImageUrl = (baseUrl, path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${baseUrl}${path}`;
};

/** Shorthand for profile images — routes through the gateway since user-service port is not published */
export const getProfileImageUrl = (profileImage) => {
  if (!profileImage) return null;
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) return profileImage;
  // Rewrite /uploads/profile-images/... → /user-uploads/profile-images/... via gateway
  const gatewayPath = profileImage.replace(/^\/uploads/, '/user-uploads');
  return `${API_URL}${gatewayPath}`;
};

/** Shorthand for collab-editor images (prefixed with COLLAB_EDITOR_URL if relative) */
export const getCollabImageUrl = (imageUrl) => resolveImageUrl(COLLAB_EDITOR_URL, imageUrl);

// Authentication
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Reading Status
export const READING_STATUS = {
  WANT_TO_READ: 'WANT_TO_READ',
  CURRENTLY_READING: 'CURRENTLY_READING',
  FINISHED: 'FINISHED',
  DNF: 'DNF', // Did Not Finish
};

// Bookclub Roles
export const BOOKCLUB_ROLES = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER',
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
};

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  TYPING: 'typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ERROR: 'error',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  BOOKCLUB: '/bookclub/:id',
  BOOKCLUB_DETAILS: '/bookclubPage/:id',
  SEARCH: '/search',
  MY_BOOKS: '/my-books',
};

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Debounce Delays
export const SEARCH_DEBOUNCE_MS = 300;
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

// UI Constants
export const TOAST_DURATION = 3000;
export const MODAL_ANIMATION_DURATION = 200;
