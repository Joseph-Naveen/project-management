import { Request, Response } from 'express';
import { Project, Task, User, TimeLog, Notification, Activity } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Get total projects
    const totalProjects = await Project.count();

    // Get active projects
    const activeProjects = await Project.count({
      where: { status: 'active' }
    });

    // Get completed tasks
    const completedTasks = await Task.count({
      where: { status: 'done' }
    });

    // Get total tasks
    const totalTasks = await Task.count();

    // Get total users
    const totalUsers = await User.count({
      where: { isActive: true }
    });

    // Get total time logged this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const totalTimeThisWeek = await TimeLog.sum('duration', {
      where: {
        date: {
          [Op.gte]: startOfWeek
        }
      }
    });

    // Get tasks by status
    const tasksByStatus = await Task.findAll({
      attributes: ['status', [Task.sequelize?.fn('COUNT', '*') || 'COUNT(*)', 'count']],
      group: ['status']
    });

    // Get projects by status
    const projectsByStatus = await Project.findAll({
      attributes: ['status', [Project.sequelize?.fn('COUNT', '*') || 'COUNT(*)', 'count']],
      group: ['status']
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProjects,
          activeProjects,
          completedTasks,
          totalTasks,
          totalUsers,
          totalTimeThisWeek: totalTimeThisWeek || 0,
          tasksByStatus,
          projectsByStatus,
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch dashboard statistics', 500);
  }
};

// Get recent projects
export const getRecentProjects = async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;

    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      limit: Number(limit),
      order: [['updatedAt', 'DESC']],
    });

    // Get task counts for each project
    const projectsWithTaskCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.findAll({
          where: { projectId: project.id },
          attributes: [
            'status',
            [Task.sequelize?.fn('COUNT', '*') || 'COUNT(*)', 'count']
          ],
          group: ['status'],
          raw: true
        });

        // Initialize all statuses to 0
        const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };
        
        // Populate actual counts
        taskCounts.forEach((task: any) => {
          if (task.status in counts) {
            counts[task.status as keyof typeof counts] = parseInt(task.count as string) || 0;
          }
        });

        const totalTasks = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const progress = totalTasks > 0 ? Math.round((counts.done / totalTasks) * 100) : 0;

        return {
          ...project.toJSON(),
          taskCounts: counts,
          taskCount: totalTasks,
          progress
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        projects: projectsWithTaskCounts,
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch recent projects', 500);
  }
};

// Get recent activity
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    // Fetch real activities from the database
    const activities = await Activity.findAll({
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
    });

    // Transform the data to match the expected format
    const formattedActivities = activities.map((activity: any) => ({
      id: activity.id,
      type: `${activity.entity}_${activity.type}`,
      description: activity.description,
      entityId: activity.entityId,
      entityType: activity.entity,
      actorId: activity.actorId,
      actor: activity.actor ? {
        id: activity.actor.id,
        name: activity.actor.name,
        avatar: activity.actor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.actor.name)}&background=6366f1&color=ffffff`,
      } : null,
      createdAt: activity.createdAt,
      metadata: activity.metadata,
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: formattedActivities,
      },
    });
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    throw new AppError('Failed to fetch recent activity', 500);
  }
};

// Get user dashboard data
export const getUserDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Get user's assigned tasks
    const assignedTasks = await Task.count({
      where: { assigneeId: userId }
    });

    // Get user's completed tasks
    const completedTasks = await Task.count({
      where: { 
        assigneeId: userId,
        status: 'done'
      }
    });

    // Get user's time logged this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const timeThisWeek = await TimeLog.sum('duration', {
      where: {
        userId,
        date: {
          [Op.gte]: startOfWeek
        }
      }
    });

    // Get user's projects
    const userProjects = await Project.findAll({
      where: {
        [Op.or]: [
          { ownerId: userId },
          { '$members.userId$': userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: require('../models').ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar'],
            },
          ],
        },
      ],
    });

    // Get user's recent time logs
    const recentTimeLogs = await TimeLog.findAll({
      where: { userId },
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
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          assignedTasks,
          completedTasks,
          timeThisWeek: timeThisWeek || 0,
        },
        projects: userProjects.map(project => project.toJSON()),
        recentTimeLogs: recentTimeLogs.map(timeLog => timeLog.toJSON()),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch user dashboard', 500);
  }
}; 