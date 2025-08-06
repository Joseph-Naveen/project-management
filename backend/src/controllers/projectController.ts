import { Request, Response, NextFunction } from 'express';
import { Project, User, Task, ProjectMember } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';
import { emitToProject, emitToAll } from '../sockets';
import { asyncHandlerWithLogging } from '../middleware/asyncHandler';

// Get all projects
export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      priority, 
      ownerId,
      includeTaskCounts = 'true'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Add search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
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

    // Add owner filter
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    let projectsData = projects.map(project => project.toJSON());

    // Include task counts and calculated progress if requested
    if (includeTaskCounts === 'true') {
      projectsData = await Promise.all(
        projectsData.map(async (project) => {
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
            ...project,
            taskCounts: counts,
            taskCount: totalTasks,
            progress
          };
        })
      );
    }

    res.status(200).json({
      success: true,
      data: {
        projects: projectsData,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar', 'role'],
            },
          ],
        },
      ],
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Get task counts for the project
    const taskCounts = await Task.findAll({
      where: { projectId: id },
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

    const projectData = {
      ...project.toJSON(),
      taskCounts: counts,
      taskCount: totalTasks,
      progress
    };

    res.status(200).json({
      success: true,
      data: {
        project: projectData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create project
export const createProject = asyncHandlerWithLogging(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { 
      name, 
      description, 
      status = 'planning', 
      priority = 'medium',
      startDate,
      endDate,
      budget,
      tags = [],
      memberIds = []
    } = req.body;

    if (!name) {
      throw new AppError('Project name is required', 400);
    }

    // Validate and process dates
    let processedStartDate = null;
    let processedEndDate = null;

    if (startDate && startDate.trim() !== '') {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        throw new AppError('Invalid start date format', 400);
      }
      processedStartDate = parsedStartDate;
    }

    if (endDate && endDate.trim() !== '') {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        throw new AppError('Invalid end date format', 400);
      }
      processedEndDate = parsedEndDate;
    }

    // Validate date logic
    if (processedStartDate && processedEndDate && processedStartDate > processedEndDate) {
      throw new AppError('Start date cannot be after end date', 400);
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      status,
      priority,
      startDate: processedStartDate,
      endDate: processedEndDate,
      budget,
      tags,
      ownerId: userId,
    });

    // Add project members
    if (memberIds.length > 0) {
      const memberPromises = memberIds.map((memberId: string) =>
        ProjectMember.create({
          projectId: project.id,
          userId: memberId,
          role: 'member',
        })
      );
      await Promise.all(memberPromises);
    }

    // Add owner as member
    await ProjectMember.create({
      projectId: project.id,
      userId,
      role: 'owner',
    });

    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    // Emit socket event for new project
    emitToAll('project:create', { project: createdProject?.toJSON() });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: createdProject?.toJSON(),
      },
    });
  } catch (error) {
    console.error('❌ Project creation error:', error);
    next(error);
  }
}, 'POST /projects');

// Update project
export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      status, 
      priority, 
      startDate, 
      endDate, 
      budget, 
      progress,
      tags 
    } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Validate and process dates
    let processedStartDate = null;
    let processedEndDate = null;

    if (startDate !== undefined) {
      if (startDate && startDate.trim() !== '') {
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          throw new AppError('Invalid start date format', 400);
        }
        processedStartDate = parsedStartDate;
      }
    } else {
      processedStartDate = project.startDate; // Keep existing value
    }

    if (endDate !== undefined) {
      if (endDate && endDate.trim() !== '') {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw new AppError('Invalid end date format', 400);
        }
        processedEndDate = parsedEndDate;
      }
    } else {
      processedEndDate = project.endDate; // Keep existing value
    }

    // Validate date logic
    if (processedStartDate && processedEndDate && processedStartDate > processedEndDate) {
      throw new AppError('Start date cannot be after end date', 400);
    }

    // Update project
    await project.update({
      name,
      description,
      status,
      priority,
      startDate: processedStartDate,
      endDate: processedEndDate,
      budget,
      progress,
      tags,
    });

    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar', 'role'],
            },
          ],
        },
      ],
    });

    // Emit socket event for project update
    if (id) {
      emitToProject(id, 'project:update', { project: updatedProject?.toJSON() });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject?.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete project
export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { cascade, force } = req.query; // Optional cascade and force parameters

    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check for existing tasks
    const taskCount = await Task.count({ where: { projectId: id } });
    
    // If there are tasks and no cascade/force flag, return options to user
    if (taskCount > 0 && cascade !== 'true' && force !== 'true') {
      res.status(409).json({
        success: false,
        message: `Cannot delete project with existing tasks`,
        code: 'PROJECT_HAS_TASKS',
        details: {
          taskCount,
          options: [
            {
              action: 'cascade',
              description: 'Delete project and all associated tasks',
              warning: 'This action cannot be undone'
            },
            {
              action: 'archive',
              description: 'Archive the project instead of deleting it',
              endpoint: `/api/projects/${id}/archive`
            }
          ]
        }
      });
      return;
    }

    // If cascade is true, delete associated tasks first
    if (cascade === 'true' || force === 'true') {
      console.log(`🗑️ Cascading delete for project ${id} - removing ${taskCount} tasks`);
      await Task.destroy({ where: { projectId: id } });
    }

    // Delete project members first
    await ProjectMember.destroy({ where: { projectId: id } });

    // Delete project
    await project.destroy();

    // Emit socket event for project deletion
    if (id) {
      emitToProject(id, 'project:delete', { projectId: id });
    }

    res.status(200).json({
      success: true,
      message: `Project deleted successfully${cascade === 'true' ? ' (with all tasks)' : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

// Archive project (alternative to deletion)
export const archiveProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Update project status to archived
    await project.update({ 
      status: 'archived',
      archivedAt: new Date()
    });

    // Emit socket event for project archive
    if (id) {
      emitToProject(id, 'project:archive', { projectId: id });
    }

    res.status(200).json({
      success: true,
      message: 'Project archived successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Get project tasks
export const getProjectTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where: any = { projectId: id };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const tasks = await Task.findAll({
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
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        tasks: tasks.map(task => task.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get project members
export const getProjectMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const members = await ProjectMember.findAll({
      where: { projectId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar', 'role', 'department'],
        },
      ],
      order: [['joinedAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        members: members.map(member => member.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add project member
export const addProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if member already exists
    const existingMember = await ProjectMember.findOne({
      where: { projectId: id, userId },
    });

    if (existingMember) {
      throw new AppError('User is already a member of this project', 409);
    }

    // Add member
    const member = await ProjectMember.create({
      projectId: id,
      userId,
      role,
    });

    const memberWithUser = await ProjectMember.findByPk(member.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar', 'role'],
        },
      ],
    });

    // Emit socket event for member addition
    if (id) {
      emitToProject(id, 'project:member:add', { 
        projectId: id, 
        member: memberWithUser?.toJSON() 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        member: memberWithUser?.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove project member
export const removeProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId } = req.params;

    const member = await ProjectMember.findOne({
      where: { projectId: id, userId },
    });

    if (!member) {
      throw new AppError('Project member not found', 404);
    }

    // Don't allow removing the owner
    if (member.role === 'owner') {
      throw new AppError('Cannot remove project owner', 400);
    }

    await member.destroy();

    // Emit socket event for member removal
    if (id) {
      emitToProject(id, 'project:member:remove', { 
        projectId: id, 
        userId 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update project status
export const updateProjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await project.update({ status });

    res.status(200).json({
      success: true,
      message: 'Project status updated successfully',
      data: {
        project: project.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update project progress
export const updateProjectProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      throw new AppError('Progress must be between 0 and 100', 400);
    }

    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await project.update({ progress });

    res.status(200).json({
      success: true,
      message: 'Project progress updated successfully',
      data: {
        project: project.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get project statistics
export const getProjectStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Get task statistics
    const totalTasks = await Task.count({ where: { projectId: id } });
    const completedTasks = await Task.count({ 
      where: { projectId: id, status: 'done' } 
    });

    // Get member count
    const memberCount = await ProjectMember.count({ where: { projectId: id } });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTasks,
          completedTasks,
          progress: project.progress,
          memberCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}; 