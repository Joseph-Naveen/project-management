import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Project CRUD routes
router.get('/', asyncHandler(projectController.getProjects));
router.get('/:id', asyncHandler(projectController.getProjectById));
router.post('/', asyncHandler(projectController.createProject));
router.put('/:id', asyncHandler(projectController.updateProject));
router.delete('/:id', asyncHandler(projectController.deleteProject));

// Project status and progress routes
router.put('/:id/status', asyncHandler(projectController.updateProjectStatus));
router.put('/:id/progress', asyncHandler(projectController.updateProjectProgress));
router.put('/:id/archive', asyncHandler(projectController.archiveProject));

// Project relationships routes
router.get('/:id/tasks', asyncHandler(projectController.getProjectTasks));
router.get('/:id/members', asyncHandler(projectController.getProjectMembers));
router.post('/:id/members', asyncHandler(projectController.addProjectMember));
router.delete('/:id/members/:userId', asyncHandler(projectController.removeProjectMember));

// Project statistics routes
router.get('/:id/stats', asyncHandler(projectController.getProjectStats));

export default router; 