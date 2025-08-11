import rateLimit from 'express-rate-limit';
import config from '../config/app';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: (process.env['NODE_ENV'] === 'development') ? 2000 : config.rateLimit.maxRequests, // bump all requests in dev
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'Rate limit exceeded'
    });
  }
});

// Specific rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (process.env['NODE_ENV'] === 'development') ? 1000 : 50, // higher limits in dev, reasonable in prod
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'Authentication rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      error: 'Authentication rate limit exceeded'
    });
  }
}); 