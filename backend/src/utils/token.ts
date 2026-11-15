import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/auth';

export const parseDurationToMs = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    const parsed = Number(duration);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed * 1000;
    }
    return 15 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
};

export const ACCESS_TOKEN_EXPIRY_MS = parseDurationToMs(env.ACCESS_TOKEN_EXPIRES_IN);
export const REFRESH_TOKEN_EXPIRY_MS = parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN);

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};
