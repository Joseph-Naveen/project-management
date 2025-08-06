import express from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
} from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/teams - Get all teams
router.get('/', getTeams);

// GET /api/teams/:id - Get team by id
router.get('/:id', getTeamById);

// POST /api/teams - Create new team (Admin/Manager only)
router.post('/', authorize('admin', 'manager'), createTeam);

// PUT /api/teams/:id - Update team (Admin/Manager only)
router.put('/:id', authorize('admin', 'manager'), updateTeam);

// DELETE /api/teams/:id - Delete team (Admin only)
router.delete('/:id', authorize('admin'), deleteTeam);

export default router;
