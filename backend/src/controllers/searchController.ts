import { Request, Response } from 'express';
import { Project, Task, User } from '../models';
import { AppError } from '../types';
import { Op } from 'sequelize';

// Global search
export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { query, entity, filters } = req.query;

    if (!query || typeof query !== 'string') {
      throw new AppError('Search query is required', 400);
    }

    const searchTerm = `%${query}%`;
    const results: any = {};

    // Search projects
    if (!entity || entity === 'projects') {
      const projects = await Project.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: searchTerm } },
            { description: { [Op.iLike]: searchTerm } },
          ],
        },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
        ],
        limit: 10,
      });
      results.projects = projects.map(project => project.toJSON());
    }

    // Search tasks
    if (!entity || entity === 'tasks') {
      const tasks = await Task.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: searchTerm } },
            { description: { [Op.iLike]: searchTerm } },
          ],
        },
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name'],
          },
        ],
        limit: 10,
      });
      results.tasks = tasks.map(task => task.toJSON());
    }

    // Search users
    if (!entity || entity === 'users') {
      const users = await User.findAll({
        where: {
          [Op.and]: [
            { isActive: true },
            {
              [Op.or]: [
                { name: { [Op.iLike]: searchTerm } },
                { email: { [Op.iLike]: searchTerm } },
                { department: { [Op.iLike]: searchTerm } },
              ],
            },
          ],
        },
        attributes: ['id', 'name', 'email', 'avatar', 'role', 'department'],
        limit: 10,
      });
      results.users = users.map(user => user.toJSON());
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        query,
        totalResults: Object.values(results).reduce((acc: number, curr: any) => acc + curr.length, 0),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Search failed', 500);
  }
};

// Save search query
export const saveSearch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, query, filters } = req.body;

    if (!name || !query) {
      throw new AppError('Name and query are required', 400);
    }

    // For now, we'll return a mock response
    // In a real implementation, you would store saved searches in a separate table
    res.status(201).json({
      success: true,
      message: 'Search saved successfully',
      data: {
        savedSearch: {
          id: 'saved-search-id',
          name,
          query,
          filters,
          userId,
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to save search', 500);
  }
};

// Get saved searches
export const getSavedSearches = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // For now, we'll return a mock response
    // In a real implementation, you would query saved searches from database
    const savedSearches = [
      {
        id: '1',
        name: 'My Projects',
        query: 'project',
        filters: { entity: 'projects' },
        userId,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'High Priority Tasks',
        query: 'priority:high',
        filters: { entity: 'tasks', priority: 'high' },
        userId,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        savedSearches,
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch saved searches', 500);
  }
};

// Delete saved search
export const deleteSavedSearch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    // For now, we'll return a mock response
    // In a real implementation, you would delete from database
    res.status(200).json({
      success: true,
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    throw new AppError('Failed to delete saved search', 500);
  }
}; 