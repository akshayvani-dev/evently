import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { authenticate, authorize } from '../src/middlewares/auth.middleware';
import apiRouter from '../src/routes';
import { hashToken } from '../src/utils/hash';

const getCookieValue = (res: request.Response, cookieName: string): string | undefined => {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return undefined;
  const cookieHeaders = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const header of cookieHeaders) {
    if (header.startsWith(`${cookieName}=`)) {
      const firstPart = header.split(';')[0];
      return firstPart.substring(cookieName.length + 1);
    }
  }
  return undefined;
};

describe('Auth Integration Tests', () => {
  const testUser = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: 'Password123!',
    role: 'organizer' as const,
  };

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a user, set cookies, and return sanitized user without tokens in body', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.role).toBe(testUser.role);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.tokens).toBeUndefined();
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();

      // Check cookies
      const accessToken = getCookieValue(res, 'accessToken');
      const refreshToken = getCookieValue(res, 'refreshToken');

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // Verify token hash was stored in DB
      const hashedRefreshToken = hashToken(refreshToken!);
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashedRefreshToken },
      });
      expect(storedToken).toBeDefined();
      expect(storedToken?.revokedAt).toBeNull();
    });

    it('should return 409 conflict when signing up with an already registered email', async () => {
      await request(app).post('/api/auth/signup').send(testUser);

      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should return 400 validation error on weak password or invalid email', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Bad User',
        email: 'invalid-email',
        password: '123',
        role: 'attendee',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send(testUser);
    });

    it('should sign in successfully, set cookies, and return no tokens in body', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();

      const accessToken = getCookieValue(res, 'accessToken');
      const refreshToken = getCookieValue(res, 'refreshToken');
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('should return 401 with generic message on wrong password', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 with generic message on nonexistent email', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info when valid access token cookie is provided', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const accessToken = getCookieValue(signupRes, 'accessToken');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.role).toBe(testUser.role);
    });

    it('should return 401 when access token cookie is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token missing/i);
    });

    it('should return 401 when access token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['accessToken=invalid.token.here']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });
  });

  describe('POST /api/auth/refresh (Rotation & Reuse Detection)', () => {
    it('should rotate tokens and return new cookies', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const initialRefreshToken = getCookieValue(signupRes, 'refreshToken')!;

      // Call refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);

      const newAccessToken = getCookieValue(refreshRes, 'accessToken');
      const newRefreshToken = getCookieValue(refreshRes, 'refreshToken');

      expect(newAccessToken).toBeDefined();
      expect(newRefreshToken).toBeDefined();
      expect(newRefreshToken).not.toBe(initialRefreshToken);

      // Verify old refresh token is marked revoked
      const oldHash = hashToken(initialRefreshToken);
      const oldRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash: oldHash },
      });
      expect(oldRecord?.revokedAt).not.toBeNull();

      // Verify new refresh token is active in DB
      const newHash = hashToken(newRefreshToken!);
      const newRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash: newHash },
      });
      expect(newRecord).toBeDefined();
      expect(newRecord?.revokedAt).toBeNull();
    });

    it('should detect reuse of a revoked refresh token, revoke all tokens, and return 401', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const initialRefreshToken = getCookieValue(signupRes, 'refreshToken')!;

      // First refresh succeeds and rotates the token
      const firstRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`]);

      expect(firstRefreshRes.status).toBe(200);
      const rotatedRefreshToken = getCookieValue(firstRefreshRes, 'refreshToken')!;

      // Attempt reuse: present the old initialRefreshToken again
      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.success).toBe(false);
      expect(reuseRes.body.message).toMatch(/reuse detected/i);

      // Verify ALL tokens for the user were revoked
      const rotatedHash = hashToken(rotatedRefreshToken);
      const rotatedRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash: rotatedHash },
      });
      expect(rotatedRecord?.revokedAt).not.toBeNull();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookies and revoke refresh token in database', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const refreshToken = getCookieValue(signupRes, 'refreshToken')!;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.data.message).toBe('Logged out successfully');

      // Check cookie headers indicate deletion (empty / expires in past)
      const rawCookies = logoutRes.headers['set-cookie'];
      const setCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(setCookies).toBeDefined();
      const hasClearedAccess = setCookies.some(
        (c) => c.includes('accessToken=;') || c.includes('Max-Age=0') || c.includes('expires=')
      );
      const hasClearedRefresh = setCookies.some(
        (c) => c.includes('refreshToken=;') || c.includes('Max-Age=0') || c.includes('expires=')
      );
      expect(hasClearedAccess).toBe(true);
      expect(hasClearedRefresh).toBe(true);

      // Verify token in DB was marked revoked
      const tokenHash = hashToken(refreshToken);
      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(stored?.revokedAt).not.toBeNull();
    });

    it('should succeed with 200 even if cookies are missing', async () => {
      const logoutRes = await request(app).post('/api/auth/logout');
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });

  describe('Role-based Access Control (authorize middleware)', () => {
    beforeAll(() => {
      apiRouter.get(
        '/test-organizer-only',
        authenticate,
        authorize('organizer'),
        (_req, res) => {
          res.status(200).json({ success: true, data: { access: 'granted' } });
        }
      );
    });

    it('should allow organizer to access organizer-only route', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const accessToken = getCookieValue(signupRes, 'accessToken');

      const res = await request(app)
        .get('/api/test-organizer-only')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.access).toBe('granted');
    });

    it('should return 403 forbidden when attendee accesses organizer-only route', async () => {
      const attendeeUser = {
        name: 'Attendee User',
        email: 'attendee@example.com',
        password: 'Password123!',
        role: 'attendee' as const,
      };
      const signupRes = await request(app).post('/api/auth/signup').send(attendeeUser);
      const accessToken = getCookieValue(signupRes, 'accessToken');

      const res = await request(app)
        .get('/api/test-organizer-only')
        .set('Cookie', [`accessToken=${accessToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });
  });
});
