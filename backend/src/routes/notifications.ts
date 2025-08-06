import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Notification routes with async error handling
router.get('/', asyncHandler(notificationController.getNotifications));
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));
router.get('/:id', asyncHandler(notificationController.getNotificationById));
router.put('/:id/read', asyncHandler(notificationController.markNotificationAsRead));
router.put('/mark-all-read', asyncHandler(notificationController.markAllNotificationsAsRead));
router.delete('/:id', asyncHandler(notificationController.deleteNotification));

export default router; 