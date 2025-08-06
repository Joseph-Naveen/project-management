import { Router } from 'express';
import * as reportsController from '../controllers/reportsController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Reports routes (admin and managers only)
router.get('/projects', authorize('admin', 'manager'), asyncHandler(reportsController.getProjectReports));
router.get('/teams', authorize('admin', 'manager'), asyncHandler(reportsController.getTeamReports));
router.get('/users', authorize('admin', 'manager'), asyncHandler(reportsController.getUserReports));
router.get('/export', authorize('admin', 'manager'), asyncHandler(reportsController.exportReport));

export default router; 