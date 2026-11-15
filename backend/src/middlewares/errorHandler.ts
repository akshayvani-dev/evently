import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors !== undefined ? { errors: err.errors } : {}),
    });
    return;
  }

  // Handle Express body-parser malformed JSON errors
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: string }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON payload',
    });
    return;
  }

  // Fallback internal error
  console.error('Unhandled server error:', err instanceof Error ? err.message : err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
