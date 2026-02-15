import { BookClubRole } from '@prisma/client';

/**
 * Single source of truth for role hierarchy.
 * Higher number = more privilege.
 */
export const ROLE_HIERARCHY: Record<BookClubRole, number> = {
  [BookClubRole.OWNER]: 4,
  [BookClubRole.ADMIN]: 3,
  [BookClubRole.MODERATOR]: 2,
  [BookClubRole.MEMBER]: 1,
};

/**
 * Check whether `role` meets or exceeds `requiredRole`.
 */
export function hasMinRole(role: BookClubRole, requiredRole: BookClubRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}
