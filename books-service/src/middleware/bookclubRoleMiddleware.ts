import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import logger from '../utils/logger';

/**
 * Middleware to verify user has required role in a bookclub
 * Makes request to collab-editor service to verify membership and role
 */
export const requireBookClubRole = (minRole: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' = 'MEMBER') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const bookClubId = req.params.bookClubId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!bookClubId) {
        return res.status(400).json({ error: 'Book club ID required' });
      }

      // Call collab-editor service to verify membership and role
      const collabEditorUrl = process.env.COLLAB_EDITOR_URL || 'http://collab-editor:4000';
      const verifyUrl = `${collabEditorUrl}/bookclubs/${bookClubId}/members/${userId}/verify-role`;
      
      logger.info(`Verifying role at: ${verifyUrl}`);
      
      const response = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logger.error(`Role verification failed: ${response.status} ${response.statusText}`);
        if (response.status === 403) {
          return res.status(403).json({ error: 'You must be a member to manage books in this bookclub' });
        }
        if (response.status === 404) {
          return res.status(404).json({ error: 'Book club not found' });
        }
        throw new Error('Failed to verify bookclub membership');
      }

      const data: any = await response.json();
      const { role, status } = data;

      if (status !== 'ACTIVE') {
        return res.status(403).json({ error: 'You are not an active member of this bookclub' });
      }

      // Check role hierarchy
      const roleHierarchy: Record<string, number> = {
        'OWNER': 4,
        'ADMIN': 3,
        'MODERATOR': 2,
        'MEMBER': 1
      };

      const userRoleLevel = roleHierarchy[role] || 0;
      const requiredRoleLevel = roleHierarchy[minRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          error: `You need ${minRole} role or higher to perform this action. Your role: ${role}` 
        });
      }

      // Store role in request for use in controllers
      req.bookClubRole = role;
      next();
    } catch (error: any) {
      logger.error('Error verifying bookclub role:', { error: error.message });
      res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
};
