import { Request, Response } from 'express';
import { TimeLog, User, Task, Project } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';

// Get all time logs
export const getTimeLogs = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      projectId, 
      taskId, 
      dateRange,
      startDate,
      endDate
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Add user filter
    if (userId) {
      where.userId = userId;
    }

    // Add project filter
    if (projectId) {
      where.projectId = projectId;
    }

    // Add task filter
    if (taskId) {
      where.taskId = taskId;
    }

    // Add date range filter
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const { count, rows: timeLogs } = await TimeLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['date', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        timeLogs: timeLogs.map(timeLog => timeLog.toJSON()),
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching time logs:', error);
    throw new AppError('Failed to fetch time logs', 500);
  }
};

// Get time log by ID
export const getTimeLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const timeLog = await TimeLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!timeLog) {
      throw new AppError('Time log not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        timeLog: timeLog.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch time log', 500);
  }
};

// Create time log
export const createTimeLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { 
      description, 
      duration, 
      date, 
      startTime, 
      endTime, 
      taskId, 
      projectId, 
      billable = false, 
      hourlyRate, 
      tags = [] 
    } = req.body;

    if (!description || !duration || !date || !projectId) {
      throw new AppError('Description, duration, date, and project ID are required', 400);
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if task exists (if provided)
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new AppError('Task not found', 404);
      }
    }

    // Create time log
    const timeLog = await TimeLog.create({
      description,
      duration,
      date,
      startTime,
      endTime,
      userId,
      taskId,
      projectId,
      billable,
      hourlyRate,
      tags,
    });

    const createdTimeLog = await TimeLog.findByPk(timeLog.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Time log created successfully',
      data: {
        timeLog: createdTimeLog?.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create time log', 500);
  }
};

// Update time log
export const updateTimeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { 
      description, 
      duration, 
      date, 
      startTime, 
      endTime, 
      billable, 
      hourlyRate, 
      tags 
    } = req.body;

    const timeLog = await TimeLog.findByPk(id);
    if (!timeLog) {
      throw new AppError('Time log not found', 404);
    }

    // Check if user owns the time log or is admin
    if (timeLog.userId !== userId && (req as any).user?.role !== 'admin') {
      throw new AppError('You can only edit your own time logs', 403);
    }

    // Update time log
    await timeLog.update({
      description,
      duration,
      date,
      startTime,
      endTime,
      billable,
      hourlyRate,
      tags,
    });

    const updatedTimeLog = await TimeLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Time log updated successfully',
      data: {
        timeLog: updatedTimeLog?.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update time log', 500);
  }
};

// Delete time log
export const deleteTimeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const timeLog = await TimeLog.findByPk(id);
    if (!timeLog) {
      throw new AppError('Time log not found', 404);
    }

    // Check if user owns the time log or is admin
    if (timeLog.userId !== userId && (req as any).user?.role !== 'admin') {
      throw new AppError('You can only delete your own time logs', 403);
    }

    await timeLog.destroy();

    res.status(200).json({
      success: true,
      message: 'Time log deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete time log', 500);
  }
};

// Start timer
export const startTimer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { taskId, projectId, description } = req.body;

    if (!projectId) {
      throw new AppError('Project ID is required', 400);
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if task exists (if provided)
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new AppError('Task not found', 404);
      }
    }

    // Create time log with start time
    const timeLog = await TimeLog.create({
      description: description || 'Timer started',
      duration: 0,
      date: new Date(),
      startTime: new Date(),
      userId,
      taskId,
      projectId,
      billable: false,
    });

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      data: {
        timeLog: timeLog.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to start timer', 500);
  }
};

// Stop timer
export const stopTimer = async (req: Request, res: Response) => {
  try {
    const { timeLogId } = req.body;
    const userId = (req as any).user?.id;

    if (!timeLogId) {
      throw new AppError('Time log ID is required', 400);
    }

    const timeLog = await TimeLog.findByPk(timeLogId);
    if (!timeLog) {
      throw new AppError('Time log not found', 404);
    }

    // Check if user owns the time log
    if (timeLog.userId !== userId) {
      throw new AppError('You can only stop your own timers', 403);
    }

    // Calculate duration
    const endTime = new Date();
    const duration = timeLog.startTime 
      ? (endTime.getTime() - timeLog.startTime.getTime()) / (1000 * 60 * 60) // hours
      : 0;

    // Update time log
    await timeLog.update({
      endTime,
      duration,
    });

    res.status(200).json({
      success: true,
      message: 'Timer stopped successfully',
      data: {
        timeLog: timeLog.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to stop timer', 500);
  }
};

// Approve time log (admin only)
export const approveTimeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const timeLog = await TimeLog.findByPk(id);
    if (!timeLog) {
      throw new AppError('Time log not found', 404);
    }

    // Update time log
    await timeLog.update({
      approved: true,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Time log approved successfully',
      data: {
        timeLog: timeLog.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to approve time log', 500);
  }
};

// Get active timer for user
export const getActiveTimer = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    // Check if user is requesting their own timer or is admin
    if (userId !== currentUserId && (req as any).user?.role !== 'admin') {
      throw new AppError('You can only view your own active timer', 403);
    }

    // Find active timer (time log with startTime but no endTime)
    const activeTimer = await TimeLog.findOne({
      where: {
        userId,
        startTime: { [Op.ne]: null },
        endTime: null,
      },
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!activeTimer) {
      return res.status(200).json({
        success: true,
        data: {
          activeTimer: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        activeTimer: activeTimer.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch active timer', 500);
  }
};

// Reject time log (admin only)
export const rejectTimeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    const timeLog = await TimeLog.findByPk(id);
    if (!timeLog) {
      throw new AppError('Time log not found', 404);
    }

    // Update time log
    await timeLog.update({
      approved: false,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Time log rejected successfully',
      data: {
        timeLog: timeLog.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to reject time log', 500);
  }
}; 