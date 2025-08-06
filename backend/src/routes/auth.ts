import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Public routes with rate limiting
router.post('/login', authRateLimiter, asyncHandler(authController.login));
router.post('/register', authRateLimiter, asyncHandler(authController.register));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.get('/check-email', asyncHandler(authController.checkEmail));

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));

export default router; 