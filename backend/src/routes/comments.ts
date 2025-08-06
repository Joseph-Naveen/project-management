import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Comment CRUD routes
router.get('/', asyncHandler(commentController.getComments));
router.get('/:id', asyncHandler(commentController.getCommentById));
router.post('/', asyncHandler(commentController.createComment));
router.put('/:id', asyncHandler(commentController.updateComment));
router.delete('/:id', asyncHandler(commentController.deleteComment));

// Comment reactions routes
router.post('/:id/reactions', asyncHandler(commentController.addReaction));
router.delete('/:id/reactions', asyncHandler(commentController.removeReaction));

// Comment attachments routes
router.post('/:id/attachments', asyncHandler(commentController.uploadAttachment));

export default router; 