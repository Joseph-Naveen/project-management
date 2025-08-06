import { Request, Response, NextFunction } from 'express';

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch unhandled promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Enhanced async handler with detailed error logging
 */
export const asyncHandlerWithLogging = (fn: Function, routeName?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const route = routeName || `${req.method} ${req.path}`;
    
    try {
      console.log(`🚀 [${route}] Request started`);
      await Promise.resolve(fn(req, res, next));
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${route}] Request completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${route}] Request failed after ${duration}ms:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: (req as any).user?.id || 'anonymous'
      });
      next(error);
    }
  };
}; 