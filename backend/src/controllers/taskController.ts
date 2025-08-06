import { Request, Response } from 'express';
import { Task, User, Project, Comment, TimeLog, Attachment } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';

// Get all tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      priority, 
      assigneeId,
      projectId,
      creatorId
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Add search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add priority filter
    if (priority) {
      where.priority = priority;
    }

    // Add assignee filter
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Add project filter
    if (projectId) {
      where.projectId = projectId;
    }

    // Add creator filter
    if (creatorId) {
      where.creatorId = creatorId;
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        tasks: tasks.map(task => task.toJSON()),
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch tasks', 500);
  }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.status(200).json({
      success: true,
      data: task.toJSON(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch task', 500);
  }
};

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { 
      title, 
      description, 
      projectId, 
      assigneeId, 
      priority = 'medium',
      status = 'todo',
      dueDate,
      estimatedHours,
      labels = [],
      tags = [],
      dependencies = []
    } = req.body;

    if (!title || !projectId) {
      throw new AppError('Title and project ID are required', 400);
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if assignee exists (if provided)
    let validAssigneeId = null;
    if (assigneeId && assigneeId.trim() !== '') {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) {
        throw new AppError('Assignee not found', 404);
      }
      validAssigneeId = assigneeId;
    }

    // Validate and process due date
    let validDueDate = null;
    if (dueDate && dueDate !== 'Invalid date' && dueDate.trim() !== '') {
      const parsedDate = new Date(dueDate);
      if (!isNaN(parsedDate.getTime())) {
        validDueDate = parsedDate;
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      projectId,
      assigneeId: validAssigneeId,
      creatorId: userId,
      priority,
      status,
      dueDate: validDueDate,
      estimatedHours,
      labels,
      tags,
      dependencies,
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar'],
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
      message: 'Task created successfully',
      data: {
        task: createdTask?.toJSON(),
      },
    });
  } catch (error) {
    console.error('Task creation error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    // Log the actual error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new AppError(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      status, 
      priority, 
      assigneeId, 
      dueDate, 
      estimatedHours,
      labels,
      tags,
      dependencies
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if assignee exists (if provided)
    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) {
        throw new AppError('Assignee not found', 404);
      }
    }

    // Update task
    await task.update({
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      estimatedHours,
      labels,
      tags,
      dependencies,
    });

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar'],
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
      message: 'Task updated successfully',
      data: {
        task: updatedTask?.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update task', 500);
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Delete related data
    await Comment.destroy({ where: { taskId: id } });
    await TimeLog.destroy({ where: { taskId: id } });
    await Attachment.destroy({ where: { taskId: id } });

    // Delete task
    await task.destroy();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete task', 500);
  }
};

// Update task status
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await task.update({ status });

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        task: task.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update task status', 500);
  }
};

// Update task priority
export const updateTaskPriority = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      throw new AppError('Priority is required', 400);
    }

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await task.update({ priority });

    res.status(200).json({
      success: true,
      message: 'Task priority updated successfully',
      data: {
        task: task.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update task priority', 500);
  }
};

// Assign task
export const assignTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if assignee exists
    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) {
        throw new AppError('Assignee not found', 404);
      }
    }

    await task.update({ assigneeId });

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: {
        task: task.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to assign task', 500);
  }
};

// Update task due date
export const updateTaskDueDate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await task.update({ dueDate });

    res.status(200).json({
      success: true,
      message: 'Task due date updated successfully',
      data: {
        task: task.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update task due date', 500);
  }
};

// Get task comments
export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comments = await Comment.findAll({
      where: { taskId: id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        comments: comments.map(comment => comment.toJSON()),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch task comments', 500);
  }
};

// Create task comment
export const createTaskComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;

    // Verify task exists
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const comment = await Comment.create({
      content,
      taskId: id,
      authorId: userId
    });

    // Fetch the comment with author details
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: commentWithAuthor?.toJSON()
    });
  } catch (error) {
    console.error('Create task comment error:', error);
    throw new AppError('Failed to create task comment', 500);
  }
};

// Get task time logs
export const getTaskTimeLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const timeLogs = await TimeLog.findAll({
      where: { taskId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['date', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        timeLogs: timeLogs.map(timeLog => timeLog.toJSON()),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch task time logs', 500);
  }
};

// Create time log for task
export const createTaskTimeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, duration, date, billable = false, hourlyRate = 0 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify task exists
    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const timeLog = await TimeLog.create({
      userId,
      taskId: id,
      projectId: task.projectId,
      description,
      duration: Number(duration),
      date: date || new Date().toISOString().split('T')[0],
      billable: Boolean(billable),
      hourlyRate: Number(hourlyRate),
      approved: false
    });

    // Fetch the created time log with associations
    const newTimeLog = await TimeLog.findByPk(timeLog.id, {
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
      data: newTimeLog?.toJSON(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create time log', 500);
  }
};

// Get task attachments
export const getTaskAttachments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachments = await Attachment.findAll({
      where: { taskId: id },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        attachments: attachments.map(attachment => attachment.toJSON()),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch task attachments', 500);
  }
};

// Add task watcher
export const addTaskWatcher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Add watcher to task
    const watchers = task.watchers || [];
    if (!watchers.includes(userId)) {
      watchers.push(userId);
      await task.update({ watchers });
    }

    res.status(200).json({
      success: true,
      message: 'Watcher added successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to add task watcher', 500);
  }
};

// Remove task watcher
export const removeTaskWatcher = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Remove watcher from task
    const watchers = task.watchers || [];
    const updatedWatchers = watchers.filter((watcherId: string) => watcherId !== userId);
    await task.update({ watchers: updatedWatchers });

    res.status(200).json({
      success: true,
      message: 'Watcher removed successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to remove task watcher', 500);
  }
};

// Get task statistics
export const getTaskStats = async (req: Request, res: Response) => {
  try {
    const { projectId, assigneeId, dateRange } = req.query;

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (dateRange) {
      const [startDate, endDate] = (dateRange as string).split(',');
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }
    }

    const totalTasks = await Task.count({ where });
    const tasksByStatus = await Task.findAll({
      where,
      attributes: ['status', [Task.sequelize?.fn('COUNT', '*') || 'COUNT(*)', 'count']],
      group: ['status'],
    });

    const tasksByPriority = await Task.findAll({
      where,
      attributes: ['priority', [Task.sequelize?.fn('COUNT', '*') || 'COUNT(*)', 'count']],
      group: ['priority'],
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalTasks,
          byStatus: tasksByStatus,
          byPriority: tasksByPriority,
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch task statistics', 500);
  }
}; 