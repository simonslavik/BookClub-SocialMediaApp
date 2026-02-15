import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware to verify user has required role in a bookclub
 * Makes request to collab-editor service to verify membership and role
 */
export const requireBookClubRole = (
  minRole: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' = 'MEMBER'
) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const bookClubId = req.params.bookClubId;

      if (!userId) {
        return next(new ValidationError('Authentication required'));
      }

      if (!bookClubId) {
        return next(new ValidationError('Book club ID required'));
      }

      // Call collab-editor service to verify membership and role
      const collabEditorUrl = process.env.COLLAB_EDITOR_URL || 'http://collab-editor:4000';
      const verifyUrl = `${collabEditorUrl}/bookclubs/${bookClubId}/members/${userId}/verify-role`;

      logger.info(`Verifying role at: ${verifyUrl}`);

      // Forward x-user-* headers that collab-editor's authMiddleware expects
      // (service-to-service calls bypass the gateway which normally sets these)
      const response = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-email': req.user?.email || '',
          ...(req.user?.name && { 'x-user-name': req.user.name }),
          ...(req.headers.authorization && {
            Authorization: req.headers.authorization,
          }),
        },
      });

      if (!response.ok) {
        logger.error(`Role verification failed: ${response.status} ${response.statusText}`);
        if (response.status === 403) {
          return next(new ForbiddenError('You must be a member to manage books in this bookclub'));
        }
        if (response.status === 404) {
          return next(new NotFoundError('Book club'));
        }
        throw new Error('Failed to verify bookclub membership');
      }

      const data: any = await response.json();
      const { role, status } = data;

      if (status !== 'ACTIVE') {
        return next(new ForbiddenError('You are not an active member of this bookclub'));
      }

      // Check role hierarchy
      const roleHierarchy: Record<string, number> = {
        OWNER: 4,
        ADMIN: 3,
        MODERATOR: 2,
        MEMBER: 1,
      };

      const userRoleLevel = roleHierarchy[role] || 0;
      const requiredRoleLevel = roleHierarchy[minRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return next(
          new ForbiddenError(
            `You need ${minRole} role or higher to perform this action. Your role: ${role}`
          )
        );
      }

      // Store role in request for use in controllers
      req.bookClubRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
