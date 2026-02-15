// ─── Roles ───────────────────────────────────────────────
export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER',
};

/** Numeric weight for permission checks (higher = more power). */
export const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.MODERATOR]: 2,
  [ROLES.MEMBER]: 1,
};

/** Human-readable role labels. */
export const ROLE_LABELS = {
  [ROLES.OWNER]: 'Owner',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MODERATOR]: 'Moderator',
  [ROLES.MEMBER]: 'Member',
};

/** Role badge config (icon key + colour). */
export const ROLE_CONFIG = {
  [ROLES.OWNER]: { icon: 'star', color: 'text-yellow-500' },
  [ROLES.ADMIN]: { icon: 'shield', color: 'text-blue-500' },
  [ROLES.MODERATOR]: { icon: 'award', color: 'text-green-500' },
  [ROLES.MEMBER]: { icon: 'heart', color: 'text-gray-500' },
};

/** Role ordering for display lists (highest first). */
export const ROLE_ORDER = [ROLES.OWNER, ROLES.ADMIN, ROLES.MODERATOR, ROLES.MEMBER];

/**
 * Check whether `userRole` has at least `requiredRole` permissions.
 */
export const hasPermission = (userRole, requiredRole) =>
  (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);

// ─── Club visibility ─────────────────────────────────────
export const VISIBILITY = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  INVITE_ONLY: 'INVITE_ONLY',
};

export const VISIBILITY_LABELS = {
  [VISIBILITY.PUBLIC]: 'Public',
  [VISIBILITY.PRIVATE]: 'Private',
  [VISIBILITY.INVITE_ONLY]: 'Invite Only',
};

// ─── Book statuses (within a book club) ──────────────────
export const BOOK_STATUS = {
  CURRENT: 'current',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
};

export const BOOK_STATUS_LABELS = {
  [BOOK_STATUS.CURRENT]: 'Currently Reading',
  [BOOK_STATUS.UPCOMING]: 'Upcoming',
  [BOOK_STATUS.COMPLETED]: 'Completed',
};

// ─── Reading statuses (user library) ─────────────────────
export const READING_STATUS = {
  WANT_TO_READ: 'want_to_read',
  READING: 'reading',
  COMPLETED: 'completed',
  FAVORITE: 'favorite',
};

export const READING_STATUS_LABELS = {
  [READING_STATUS.WANT_TO_READ]: 'Want to Read',
  [READING_STATUS.READING]: 'Currently Reading',
  [READING_STATUS.COMPLETED]: 'Completed',
  [READING_STATUS.FAVORITE]: 'Favorite',
};

// ─── Suggestion vote types ───────────────────────────────
export const VOTE_TYPE = {
  UPVOTE: 'upvote',
  DOWNVOTE: 'downvote',
};

// ─── Event types ─────────────────────────────────────────
export const EVENT_TYPE = {
  MEETING: 'meeting',
  BOOK_DEADLINE: 'book_deadline',
  DISCUSSION: 'discussion',
  OTHER: 'other',
};

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPE.MEETING]: 'Meeting',
  [EVENT_TYPE.BOOK_DEADLINE]: 'Book Deadline',
  [EVENT_TYPE.DISCUSSION]: 'Discussion',
  [EVENT_TYPE.OTHER]: 'Other',
};

// ─── Friendship statuses ─────────────────────────────────
export const FRIENDSHIP_STATUS = {
  FRIENDS: 'friends',
  REQUEST_SENT: 'request_sent',
  REQUEST_RECEIVED: 'request_received',
  PENDING: 'PENDING',
};

// ─── Limits ──────────────────────────────────────────────
export const LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_ROOM_NAME_LENGTH: 50,
  MAX_CLUB_NAME_LENGTH: 100,
  MAX_CLUB_DESCRIPTION_LENGTH: 500,
  MAX_FILE_SIZE_MB: 10,
  MESSAGES_PER_PAGE: 50,
  BOOK_SEARCH_LIMIT: 20,
};
