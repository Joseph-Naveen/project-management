import { Router } from 'express';
import * as timeLogController from '../controllers/timeLogController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Time log CRUD routes
router.get('/', asyncHandler(timeLogController.getTimeLogs));
router.get('/:id', asyncHandler(timeLogController.getTimeLogById));
router.post('/', asyncHandler(timeLogController.createTimeLog));
router.put('/:id', asyncHandler(timeLogController.updateTimeLog));
router.delete('/:id', asyncHandler(timeLogController.deleteTimeLog));

// Timer routes
router.post('/start', asyncHandler(timeLogController.startTimer));
router.post('/stop', asyncHandler(timeLogController.stopTimer));
router.get('/timer/active/:userId', asyncHandler(timeLogController.getActiveTimer));

// Admin only routes
router.put('/:id/approve', authorize('admin'), asyncHandler(timeLogController.approveTimeLog));
router.put('/:id/reject', authorize('admin'), asyncHandler(timeLogController.rejectTimeLog));

export default router; 