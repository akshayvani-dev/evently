import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import { ACCESS_COOKIE_NAME } from '../utils/cookie';
import { verifyAccessToken } from '../utils/token';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE_NAME];
    if (!token) {
      throw new AppError(401, 'Authentication token missing');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(401, 'Invalid or expired access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'User not found or no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) {
    next();
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (user) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError(403, 'Forbidden: insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
