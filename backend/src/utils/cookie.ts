import { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { AuthTokens } from '../types/auth';
import { ACCESS_TOKEN_EXPIRY_MS, REFRESH_TOKEN_EXPIRY_MS } from './token';

export const ACCESS_COOKIE_NAME = 'accessToken';
export const REFRESH_COOKIE_NAME = 'refreshToken';

export const getAccessCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: ACCESS_TOKEN_EXPIRY_MS,
});

export const getRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
});

export const setAuthCookies = (res: Response, tokens: AuthTokens): void => {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshCookieOptions());
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
};
