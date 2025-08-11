import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Authenticated user self-service routes FIRST (avoid "/:id" catching these)
router.put('/profile', asyncHandler(userController.updateProfile));
router.put('/change-password', asyncHandler(userController.changePassword));
router.post('/avatar', asyncHandler(userController.uploadAvatar));
router.put('/preferences', asyncHandler(userController.updatePreferences));
router.get('/activity', asyncHandler(userController.getMyActivity));

// Public user routes (authenticated users can view)
router.get('/', asyncHandler(userController.getUsers));
router.get('/:id', asyncHandler(userController.getUserById));

// Admin only routes
router.post('/', authorize('admin'), asyncHandler(userController.createUser));
router.put('/:id', authorize('admin'), asyncHandler(userController.updateUser));
router.delete('/:id', authorize('admin'), asyncHandler(userController.deleteUser));

export default router; 