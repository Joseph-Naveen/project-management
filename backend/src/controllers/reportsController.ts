import { Request, Response } from 'express';
import { Project, Task, User, TimeLog, ProjectMember, Team } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';

// Helper function to get date range filter
const getDateRangeFilter = (timeRange?: string) => {
  const now = new Date();
  let startDate: Date;
  
  switch (timeRange) {
    case 'last-week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'last-quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'last-year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // Default to last month
  }
  
  return {
    [Op.gte]: startDate,
    [Op.lte]: now
  };
};

// Get project reports
export const getProjectReports = async (req: Request, res: Response) => {
  try {
    const { timeRange, projectId } = req.query;

    let where: any = {};
    if (projectId) {
      where.id = projectId;
    }

    // Add date filter if specified
    if (timeRange) {
      where.createdAt = getDateRangeFilter(timeRange as string);
    }

    const projects = await Project.findAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'priority', 'progress', 'createdAt', 'updatedAt'],
        },
      ],
    });

    const reports = projects.map(project => {
      const projectData = project.toJSON();
      const tasks = projectData.tasks || [];
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
      const inProgressTasks = tasks.filter((task: any) => task.status === 'in_progress').length;
      const pendingTasks = tasks.filter((task: any) => task.status === 'todo').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate deadlines (simplified - assuming due_date exists)
      const overdueTasks = tasks.filter((task: any) => 
        task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
      ).length;

      return {
        id: projectData.id,
        name: projectData.name,
        status: projectData.status,
        priority: projectData.priority,
        owner: projectData.owner,
        progress: projectData.progress,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          completionRate,
          overdueTasks,
        },
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt,
      };
    });

    // Calculate overall stats
    const totalProjects = reports.length;
    const activeProjects = reports.filter(p => p.status === 'active').length;
    const completedProjects = reports.filter(p => p.status === 'completed').length;
    const avgCompletionRate = reports.length > 0 
      ? reports.reduce((sum, p) => sum + p.stats.completionRate, 0) / reports.length 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        projects: reports,
        summary: {
          totalProjects,
          activeProjects,
          completedProjects,
          avgCompletionRate,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch project reports:', error);
    throw new AppError('Failed to fetch project reports', 500);
  }
};

// Get team reports
export const getTeamReports = async (req: Request, res: Response) => {
  try {
    const { timeRange, teamId } = req.query;

    let where: any = { isActive: true };
    if (teamId) {
      where.id = teamId;
    }

    const teams = await Team.findAll({
      where,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Project,
          as: 'projects',
          include: [
            {
              model: Task,
              as: 'tasks',
              attributes: ['id', 'status', 'assigneeId', 'createdAt'],
              ...(timeRange && { where: { createdAt: getDateRangeFilter(timeRange as string) } }),
              required: false,
            },
          ],
        },
      ],
    });

    const reports = await Promise.all(
      teams.map(async (team) => {
        const teamData = team.toJSON() as any;
        const projects = teamData.projects || [];
        
        // Get all tasks from team projects
        const allTasks = projects.flatMap((project: any) => project.tasks || []);
        
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter((task: any) => task.status === 'done').length;
        const inProgressTasks = allTasks.filter((task: any) => task.status === 'in_progress').length;
        const pendingTasks = allTasks.filter((task: any) => task.status === 'todo').length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Get team members count
        const memberCount = await User.count({
          where: { teamId: team.id, isActive: true }
        });

        return {
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          manager: teamData.manager,
          memberCount,
          projectCount: projects.length,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            completionRate,
          },
          createdAt: teamData.createdAt,
          updatedAt: teamData.updatedAt,
        };
      })
    );

    // Calculate summary stats
    const totalTeams = reports.length;
    const avgCompletionRate = reports.length > 0 
      ? reports.reduce((sum, team) => sum + team.stats.completionRate, 0) / reports.length 
      : 0;
    const totalMembers = reports.reduce((sum, team) => sum + team.memberCount, 0);

    res.status(200).json({
      success: true,
      data: {
        teams: reports,
        summary: {
          totalTeams,
          totalMembers,
          avgCompletionRate,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch team reports:', error);
    throw new AppError('Failed to fetch team reports', 500);
  }
};

// Get user reports
export const getUserReports = async (req: Request, res: Response) => {
  try {
    const { timeRange, userId, department, role } = req.query;

    let where: any = { isActive: true };
    if (userId) {
      where.id = userId;
    }
    if (department) {
      where.department = department;
    }
    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'department', 'jobTitle', 'createdAt'],
    });

    const reports = await Promise.all(
      users.map(async (user) => {
        const userData = user.toJSON();

        // Get user's assigned tasks
        let taskWhere: any = { assigneeId: user.id };
        if (timeRange) {
          taskWhere.createdAt = getDateRangeFilter(timeRange as string);
        }

        const tasks = await Task.findAll({
          where: taskWhere,
          attributes: ['id', 'title', 'status', 'priority', 'progress', 'createdAt'],
        });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'done').length;
        const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
        const pendingTasks = tasks.filter(task => task.status === 'todo').length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Get user's time logs
        let timeLogWhere: any = { userId: user.id };
        if (timeRange) {
          timeLogWhere.createdAt = getDateRangeFilter(timeRange as string);
        }

        const timeLogs = await TimeLog.findAll({
          where: timeLogWhere,
          attributes: ['duration', 'billable'],
        });

        const totalHours = timeLogs.reduce((sum, log) => sum + parseFloat(log.duration.toString()), 0);
        const billableHours = timeLogs
          .filter(log => log.billable)
          .reduce((sum, log) => sum + parseFloat(log.duration.toString()), 0);

        // Get projects user is involved in
        const projectCount = await ProjectMember.count({
          where: { userId: user.id }
        });

        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          jobTitle: userData.jobTitle,
          projectCount,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            completionRate,
            totalHours,
            billableHours,
          },
          createdAt: userData.createdAt,
        };
      })
    );

    // Calculate summary stats
    const totalUsers = reports.length;
    const avgCompletionRate = reports.length > 0 
      ? reports.reduce((sum, user) => sum + user.stats.completionRate, 0) / reports.length 
      : 0;
    const totalHours = reports.reduce((sum, user) => sum + user.stats.totalHours, 0);
    const totalTasks = reports.reduce((sum, user) => sum + user.stats.totalTasks, 0);

    // Group by department
    const departmentStats = reports.reduce((acc: any, user) => {
      const dept = user.department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = { count: 0, avgCompletionRate: 0, totalHours: 0 };
      }
      acc[dept].count++;
      acc[dept].avgCompletionRate += user.stats.completionRate;
      acc[dept].totalHours += user.stats.totalHours;
      return acc;
    }, {});

    // Calculate averages for departments
    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].avgCompletionRate /= departmentStats[dept].count;
    });

    res.status(200).json({
      success: true,
      data: {
        users: reports,
        summary: {
          totalUsers,
          avgCompletionRate,
          totalHours,
          totalTasks,
          departmentStats,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch user reports:', error);
    throw new AppError('Failed to fetch user reports', 500);
  }
};

// Export report data
export const exportReport = async (req: Request, res: Response) => {
  try {
    const { type, format = 'csv', ...filters } = req.query;

    if (!type) {
      throw new AppError('Report type is required', 400);
    }

    // For now, return a mock response indicating successful export
    // In a real implementation, you would generate CSV/PDF files
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${type}-report-${timestamp}.${format}`;

    res.status(200).json({
      success: true,
      message: 'Report export initiated successfully',
      data: {
        filename,
        downloadUrl: `/api/reports/download/${filename}`,
        type: type as string,
        format: format as string,
        timestamp,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to export report', 500);
  }
};
