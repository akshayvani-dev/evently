import { Role } from '@prisma/client';

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SanitizedUser;
  tokens: AuthTokens;
}
