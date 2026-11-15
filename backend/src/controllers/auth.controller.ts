import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { clearAuthCookies, REFRESH_COOKIE_NAME, setAuthCookies } from '../utils/cookie';

const sanitizeUserResponse = (user: any) => {
  if (!user) return null;
  const { password, passwordHash, ...rest } = user;
  return {
    id: user.id,
    ...rest,
  };
};

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.signup(req.body);
      setAuthCookies(res, result.tokens);
      res.status(201).json({
        success: true,
        data: {
          user: sanitizeUserResponse(result.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.signin(req.body);
      setAuthCookies(res, result.tokens);
      res.status(200).json({
        success: true,
        data: {
          user: sanitizeUserResponse(result.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const result = await AuthService.refreshTokens(rawRefreshToken);
      setAuthCookies(res, result.tokens);
      res.status(200).json({
        success: true,
        data: {
          user: sanitizeUserResponse(result.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      await AuthService.logout(rawRefreshToken);
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: sanitizeUserResponse(req.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
