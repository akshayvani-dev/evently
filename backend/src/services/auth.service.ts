import crypto from 'node:crypto';
import { User } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import { AuthResult, SanitizedUser } from '../types/auth';
import { comparePassword, hashPassword, hashToken } from '../utils/hash';
import {
  REFRESH_TOKEN_EXPIRY_MS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token';
import { SigninInput, SignupInput } from '../validators/auth.validator';

interface LockedRefreshTokenRow {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export const sanitizeUser = (user: User): SanitizedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

export class AuthService {
  static async signup(input: SignupInput): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError(409, 'Email is already registered');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: input.role,
      },
    });

    const tokenId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ userId: user.id, tokenId });
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  static async signin(input: SigninInput): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const tokenId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ userId: user.id, tokenId });
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  static async refreshTokens(rawRefreshToken?: string): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new AppError(401, 'Refresh token missing');
    }

    try {
      verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const tokenHash = hashToken(rawRefreshToken);

    const rotation = await prisma.$transaction(async (tx) => {
      const [storedToken] = await tx.$queryRaw<LockedRefreshTokenRow[]>`
        SELECT
          "id",
          "user_id" AS "userId",
          "expires_at" AS "expiresAt",
          "revoked_at" AS "revokedAt"
        FROM "refresh_tokens"
        WHERE "token_hash" = ${tokenHash}
        FOR UPDATE
      `;

      if (!storedToken) {
        throw new AppError(401, 'Invalid refresh token');
      }

      if (storedToken.revokedAt !== null) {
        await tx.refreshToken.updateMany({
          where: { userId: storedToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return { kind: 'reuseDetected' as const };
      }

      const now = new Date();
      if (storedToken.expiresAt < now) {
        throw new AppError(401, 'Refresh token has expired');
      }

      const user = await tx.user.findUnique({
        where: { id: storedToken.userId },
      });

      if (!user) {
        throw new AppError(401, 'User no longer exists');
      }

      const revokeResult = await tx.refreshToken.updateMany({
        where: { id: storedToken.id, revokedAt: null },
        data: { revokedAt: now },
      });

      if (revokeResult.count !== 1) {
        await tx.refreshToken.updateMany({
          where: { userId: storedToken.userId, revokedAt: null },
          data: { revokedAt: now },
        });
        return { kind: 'reuseDetected' as const };
      }

      const newRefreshToken = signRefreshToken({
        userId: user.id,
        tokenId: crypto.randomUUID(),
      });
      const newAccessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      return {
        kind: 'rotated' as const,
        result: {
          user: sanitizeUser(user),
          tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        },
      };
    });

    if (rotation.kind === 'reuseDetected') {
      throw new AppError(401, 'Refresh token reuse detected. Please sign in again.');
    }

    return rotation.result;
  }

  static async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      try {
        const tokenHash = hashToken(rawRefreshToken);
        await prisma.refreshToken.updateMany({
          where: { tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch {
        // Continue even if database query fails or token format is weird
      }
    }
  }
}
