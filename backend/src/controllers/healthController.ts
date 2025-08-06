import { Request, Response } from 'express';

// Health check endpoint for Docker health checks and monitoring
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Basic health check response
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      pid: process.pid,
    };

    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

// Detailed health check with database connectivity
export const healthCheckDetailed = async (req: Request, res: Response) => {
  try {
    const { sequelize } = require('../models');
    
    // Test database connection
    let dbStatus = 'disconnected';
    let dbLatency = 0;
    
    try {
      const startTime = Date.now();
      await sequelize.authenticate();
      dbLatency = Date.now() - startTime;
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('Database health check failed:', dbError);
    }

    const healthData = {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          usage: `${Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)}%`,
        },
        system: {
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
        },
      },
    };

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    res.status(statusCode).json({
      success: statusCode === 200,
      data: healthData,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
    });
  }
};
