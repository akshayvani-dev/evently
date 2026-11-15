import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'Validation failed', result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
};
