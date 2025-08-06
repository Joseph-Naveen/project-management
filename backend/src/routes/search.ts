import { Router } from 'express';
import * as searchController from '../controllers/searchController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Search routes
router.get('/', asyncHandler(searchController.globalSearch));
router.post('/saved', asyncHandler(searchController.saveSearch));
router.get('/saved', asyncHandler(searchController.getSavedSearches));
router.delete('/saved/:id', asyncHandler(searchController.deleteSavedSearch));

export default router; 