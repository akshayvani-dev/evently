import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  },
});
