import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AppError } from '../types';
import config from '../config/app';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Verify JWT token middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    if (!decoded.userId) {
      throw new AppError('Invalid token', 401);
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    if (!decoded.userId) {
      return next();
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return next();
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Resource ownership middleware
export const authorizeResource = (resourceModel: any, resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findByPk(resourceId);

      if (!resource) {
        return next(new AppError('Resource not found', 404));
      }

      // Check if user is admin
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      if (resource.ownerId === req.user.id) {
        return next();
      }

      // Check if user is project manager and resource belongs to their project
      if (req.user.role === 'project_manager' && resource.projectId) {
        // You might want to add additional checks here
        return next();
      }

      return next(new AppError('Access denied', 403));
    } catch (error) {
      next(new AppError('Authorization failed', 500));
    }
  };
};

// Project member authorization middleware
export const authorizeProjectMember = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const projectId = req.params['projectId'] || req.params['id'];
      
      // Import ProjectMember here to avoid circular dependency
      const { ProjectMember } = await import('../models');
      
      const membership = await ProjectMember.findOne({
        where: { projectId, userId: req.user.id }
      });

      if (!membership) {
        return next(new AppError('Not a project member', 403));
      }

      next();
    } catch (error) {
      next(new AppError('Project authorization failed', 500));
    }
  };
};

// Task assignee authorization middleware
export const authorizeTaskAssignee = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const taskId = req.params['taskId'] || req.params['id'];
      
      // Import Task here to avoid circular dependency
      const { Task } = await import('../models');
      
      const task = await Task.findByPk(taskId);

      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      // Allow if user is admin
      if (req.user.role === 'admin') {
        return next();
      }

      // Allow if user is the assignee
      if (task.assigneeId === req.user.id) {
        return next();
      }

      // Allow if user is the creator
      if (task.creatorId === req.user.id) {
        return next();
      }

      return next(new AppError('Not authorized to access this task', 403));
    } catch (error) {
      next(new AppError('Task authorization failed', 500));
    }
  };
}; 