import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging
  console.error('🚨 Error Handler:', {
    message: err.message,
    statusCode: error.statusCode || 500,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    stack: process.env['NODE_ENV'] === 'development' ? err.stack : undefined
  });

  // Don't expose stack traces in production
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Cast error (MongoDB)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 400);
  }

  // Enhanced error response
  const errorResponse = {
    success: false,
    message: error.message || 'Server Error',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    ...(isDevelopment && { 
      stack: err.stack,
      details: error
    })
  };

  res.status(error.statusCode || 500).json(errorResponse);
}; 