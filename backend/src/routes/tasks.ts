import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Task CRUD routes
router.get('/', asyncHandler(taskController.getTasks));
router.get('/:id', asyncHandler(taskController.getTaskById));
router.post('/', asyncHandler(taskController.createTask));
router.put('/:id', asyncHandler(taskController.updateTask));
router.delete('/:id', asyncHandler(taskController.deleteTask));

// Task status and priority routes
router.put('/:id/status', asyncHandler(taskController.updateTaskStatus));
router.put('/:id/priority', asyncHandler(taskController.updateTaskPriority));
router.put('/:id/assign', asyncHandler(taskController.assignTask));
router.put('/:id/due-date', asyncHandler(taskController.updateTaskDueDate));

// Task relationships routes
router.get('/:id/comments', asyncHandler(taskController.getTaskComments));
router.post('/:id/comments', asyncHandler(taskController.createTaskComment));
router.get('/:id/time-logs', asyncHandler(taskController.getTaskTimeLogs));
router.post('/:id/time-logs', asyncHandler(taskController.createTaskTimeLog));
router.get('/:id/attachments', asyncHandler(taskController.getTaskAttachments));

// Task watchers routes
router.post('/:id/watchers', asyncHandler(taskController.addTaskWatcher));
router.delete('/:id/watchers/:userId', asyncHandler(taskController.removeTaskWatcher));

// Task statistics routes
router.get('/stats', asyncHandler(taskController.getTaskStats));

export default router; 