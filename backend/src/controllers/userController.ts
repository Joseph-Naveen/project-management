import { Request, Response } from 'express';
import { User, Activity } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      department, 
      active 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Add search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Add role filter
    if (role) {
      where.role = role;
    }

    // Add department filter
    if (department) {
      where.department = department;
    }

    // Add active filter
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Get assigned tasks count for each user
    const { Task } = require('../models');
    const usersWithTaskCount = await Promise.all(
      users.map(async (user) => {
        const assignedTasks = await Task.count({
          where: { assigneeId: user.id }
        });
        const createdTasks = await Task.count({
          where: { creatorId: user.id }
        });
        
        return {
          ...user.toJSON(),
          assignedTasksCount: assignedTasks,
          createdTasksCount: createdTasks,
          totalTasksCount: assignedTasks + createdTasks
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithTaskCount,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch users', 500);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch user', 500);
  }
};

// Create user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department, jobTitle, phone } = req.body;

    // Validate required fields
    if (!name || !email) {
      throw new AppError('Name and email are required', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Use email as password if no password provided
    const userPassword = password || email;

    // Create user
    const user = await User.create({
      name,
      email,
      password: userPassword,
      role: role || 'team_member',
      department,
      jobTitle,
      phone,
    });

    // Log activity
    try {
      await Activity.create({
        type: 'create',
        entity: 'user',
        entityId: user.id,
        actorId: (req as any).user?.id || user.id,
        description: `Created user ${email}`,
        metadata: { role: user.role, department: user.department }
      });
    } catch {}

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create user', 500);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, jobTitle, phone, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }
    }

    // Create update object with only the fields that should be updated
    // IMPORTANT: Do not include password in general updates
    const updateData: Partial<{
      name: string;
      email: string;
      role: string;
      department: string;
      jobTitle: string;
      phone: string;
      isActive: boolean;
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user with only the specified fields
    await user.update(updateData);

    // Log activity
    try {
      await Activity.create({
        type: 'update',
        entity: 'user',
        entityId: user.id,
        actorId: (req as any).user?.id || user.id,
        description: `Updated user ${user.email}`,
        metadata: { fields: Object.keys(updateData) }
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update user', 500);
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user has assigned tasks
    const { Task } = require('../models');
    const assignedTasks = await Task.count({
      where: {
        assigneeId: id
      }
    });

    if (assignedTasks > 0) {
      throw new AppError('Cannot delete user with assigned tasks', 400);
    }

    // Check if user is a creator of any tasks
    const createdTasks = await Task.count({
      where: {
        creatorId: id
      }
    });

    if (createdTasks > 0) {
      throw new AppError('Cannot delete user who has created tasks', 400);
    }

    // Soft delete by deactivating
    await user.update({ isActive: false });

    // Log activity
    try {
      await Activity.create({
        type: 'delete',
        entity: 'user',
        entityId: user.id,
        actorId: (req as any).user?.id || user.id,
        description: `Deactivated user ${user.email}`,
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete user', 500);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, email, department, jobTitle, phone } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }
    }

    // Create update object with only profile fields
    // IMPORTANT: Never include password in profile updates
    const updateData: Partial<{
      name: string;
      email: string;
      department: string;
      jobTitle: string;
      phone: string;
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (phone !== undefined) updateData.phone = phone;

    // Update profile with only the specified fields
    await user.update(updateData);

    // Log activity
    try {
      await Activity.create({
        type: 'update',
        entity: 'user',
        entityId: user.id,
        actorId: user.id,
        description: 'Updated profile information',
        metadata: { fields: Object.keys(updateData) }
      });
    } catch (e) {
      // Non-blocking
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update profile', 500);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    await user.update({ password: newPassword });

    // Log activity (do not include sensitive data)
    try {
      await Activity.create({
        type: 'update',
        entity: 'user',
        entityId: user.id,
        actorId: user.id,
        description: 'Changed account password',
        metadata: { action: 'change_password' }
      });
    } catch (e) {
      // Non-blocking
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to change password', 500);
  }
};

// Upload avatar
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // For now, we'll return a mock response
    // In a real implementation, you would handle file upload
    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: 'https://via.placeholder.com/150',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to upload avatar', 500);
  }
};

// Update user preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { theme, language } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // TODO: persist preferences in dedicated table; for now echo back allowed fields
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: {
          theme,
          language,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update preferences', 500);
  }
}; 

// Get authenticated user's activity
export const getMyActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { limit = 10 } = req.query;

    const activities = await Activity.findAll({
      where: { actorId: userId },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      data: {
        activities: activities.map((a: any) => ({
          id: a.id,
          type: `${a.entity}_${a.type}`,
          description: a.description,
          createdAt: a.createdAt,
          metadata: a.metadata,
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch activity', 500);
  }
};