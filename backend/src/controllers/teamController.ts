import { Request, Response } from 'express';
import { Team, User } from '../models';

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return res.status(500).json({
      success: false,
      errors: ['Failed to fetch teams']
    });
  }
};

// @desc    Get team by id
// @route   GET /api/teams/:id
// @access  Private
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        errors: ['Team not found']
      });
    }

    return res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    return res.status(500).json({
      success: false,
      errors: ['Failed to fetch team']
    });
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Admin/Manager only)
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, managerId } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        errors: ['Team name is required']
      });
    }

    // Validate manager exists and has manager role
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          errors: ['Manager not found']
        });
      }
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        return res.status(400).json({
          success: false,
          errors: ['User must have manager or admin role to manage a team']
        });
      }
    }

    const team = await Team.create({
      name,
      description,
      managerId,
      isActive: true
    });

    // Fetch the created team with manager info
    const createdTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: createdTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    return res.status(500).json({
      success: false,
      errors: ['Failed to create team']
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Admin/Manager only)
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, managerId, isActive } = req.body;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        errors: ['Team not found']
      });
    }

    // Validate manager exists and has manager role
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          errors: ['Manager not found']
        });
      }
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        return res.status(400).json({
          success: false,
          errors: ['User must have manager or admin role to manage a team']
        });
      }
    }

    // Update team
    await team.update({
      name: name || team.name,
      description: description !== undefined ? description : team.description,
      managerId: managerId !== undefined ? managerId : team.managerId,
      isActive: isActive !== undefined ? isActive : team.isActive
    });

    // Fetch updated team with manager info
    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    return res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    return res.status(500).json({
      success: false,
      errors: ['Failed to update team']
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Admin only)
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        errors: ['Team not found']
      });
    }

    await team.destroy();

    return res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return res.status(500).json({
      success: false,
      errors: ['Failed to delete team']
    });
  }
};
