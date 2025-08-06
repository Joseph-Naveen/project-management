import { Router } from 'express';
import { healthCheck, healthCheckDetailed } from '../controllers/healthController';

const router = Router();

// Basic health check endpoint
router.get('/health', healthCheck);

// Detailed health check with database connectivity
router.get('/health/detailed', healthCheckDetailed);

export default router;
