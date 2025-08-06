import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Dashboard routes
router.get('/stats', asyncHandler(dashboardController.getDashboardStats));
router.get('/recent-projects', asyncHandler(dashboardController.getRecentProjects));
router.get('/recent-activity', asyncHandler(dashboardController.getRecentActivity));
router.get('/user', asyncHandler(dashboardController.getUserDashboard));

export default router; 