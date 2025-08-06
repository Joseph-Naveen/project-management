import { Router } from 'express';
import * as attachmentController from '../controllers/attachmentController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Attachment routes
router.get('/', asyncHandler(attachmentController.getAttachmentsByEntity));
router.get('/:id', asyncHandler(attachmentController.getAttachmentById));
router.post('/', asyncHandler(attachmentController.uploadAttachment));
router.delete('/:id', asyncHandler(attachmentController.deleteAttachment));
router.get('/:id/download', asyncHandler(attachmentController.downloadAttachment));

export default router; 