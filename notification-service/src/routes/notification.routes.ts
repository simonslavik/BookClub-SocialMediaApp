import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// User-facing endpoints (require auth via gateway headers)
router.get('/', authMiddleware, NotificationController.getNotifications);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.patch('/read-all', authMiddleware, NotificationController.markAllRead);
router.patch('/:id/read', authMiddleware, NotificationController.markRead);
router.delete('/:id', authMiddleware, NotificationController.dismiss);

// Internal endpoint — called by collab-editor (service-to-service, no user auth)
router.post('/internal/meeting', NotificationController.handleMeetingEvent);

export default router;
