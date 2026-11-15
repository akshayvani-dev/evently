import request, { Response } from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

const getCookieValue = (res: Response, cookieName: string): string | undefined => {
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

describe('Event CRUD Integration Tests', () => {
  const organizerA = {
    name: 'Organizer Alice',
    email: 'alice@evently.test',
    password: 'Password123!',
    role: 'organizer' as const,
  };

  const organizerB = {
    name: 'Organizer Bob',
    email: 'bob@evently.test',
    password: 'Password123!',
    role: 'organizer' as const,
  };

  const attendee = {
    name: 'Attendee Charlie',
    email: 'charlie@evently.test',
    password: 'Password123!',
    role: 'attendee' as const,
  };

  let tokenAlice: string;
  let tokenBob: string;
  let tokenCharlie: string;

  const validFutureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const sampleEventData = {
    title: 'Tech Summit 2027',
    description: 'An international tech summit',
    startAt: validFutureDate,
    timezone: 'UTC',
    location: 'Metropolitan Center, Hall A',
    capacity: 250,
    status: 'draft' as const,
  };

  beforeEach(async () => {
    await prisma.registration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Sign up Alice
    const resA = await request(app).post('/api/v1/auth/signup').send(organizerA);
    tokenAlice = getCookieValue(resA, 'accessToken')!;

    // Sign up Bob
    const resB = await request(app).post('/api/v1/auth/signup').send(organizerB);
    tokenBob = getCookieValue(resB, 'accessToken')!;

    // Sign up Charlie (Attendee)
    const resC = await request(app).post('/api/v1/auth/signup').send(attendee);
    tokenCharlie = getCookieValue(resC, 'accessToken')!;
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/v1/events').send(sampleEventData);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when an attendee attempts to access organizer endpoints', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenCharlie}`])
        .send(sampleEventData);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });
  });

  describe('POST /api/v1/events (Create Event)', () => {
    it('should allow organizer to create an event with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(sampleEventData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event).toBeDefined();
      expect(res.body.data.event.id).toBeDefined();
      expect(res.body.data.event.title).toBe(sampleEventData.title);
      expect(res.body.data.event.capacity).toBe(sampleEventData.capacity);
      expect(res.body.data.event.timezone).toBe(sampleEventData.timezone);
      expect(res.body.data.event.status).toBe('draft');
      expect(res.body.data.event.organizerId).toBeDefined();
    });

    it('should reject creation when capacity <= 0', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({
          ...sampleEventData,
          capacity: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject creation when startAt is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({
          ...sampleEventData,
          startAt: pastDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject creation with an invalid IANA timezone', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({
          ...sampleEventData,
          timezone: 'Not/A_Real_Timezone',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject unknown fields (e.g., id, organizerId, createdAt)', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({
          ...sampleEventData,
          organizerId: 'malicious-id',
          createdAt: new Date().toISOString(),
          extraProperty: 'not-allowed',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('Ownership Enforcement (Organizer B cannot update or delete Organizer A\'s event)', () => {
    let eventId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(sampleEventData);
      eventId = createRes.body.data.event.id;
    });

    it('should return 403 when organizer B attempts to PUT update organizer A\'s event', async () => {
      const updateData = {
        title: 'Hacked Title',
        description: 'New Description',
        startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        timezone: 'UTC',
        location: 'Somewhere Else',
        capacity: 100,
        status: 'published' as const,
      };

      const res = await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenBob}`])
        .send(updateData);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should return 403 when organizer B attempts to PATCH update organizer A\'s event', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenBob}`])
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should return 403 when organizer B attempts to DELETE organizer A\'s event', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenBob}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);

      // Verify event was NOT deleted
      const check = await prisma.event.findUnique({ where: { id: eventId } });
      expect(check).not.toBeNull();
    });

    it('should return 404 when updating or deleting a nonexistent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const patchRes = await request(app)
        .patch(`/api/v1/events/${fakeId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({ title: 'Nonexistent' });

      expect(patchRes.status).toBe(404);
      expect(patchRes.body.success).toBe(false);

      const deleteRes = await request(app)
        .delete(`/api/v1/events/${fakeId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`]);

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body.success).toBe(false);
    });
  });

  describe('PUT vs PATCH Behavior', () => {
    let eventId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(sampleEventData);
      eventId = createRes.body.data.event.id;
    });

    it('PUT requires all fields and updates the event', async () => {
      const newFutureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const fullUpdate = {
        title: 'Full Updated Summit',
        description: 'Complete new description',
        startAt: newFutureDate,
        timezone: 'America/New_York',
        location: 'Grand Ballroom, NY',
        capacity: 500,
        status: 'published' as const,
      };

      const res = await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(fullUpdate);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.title).toBe(fullUpdate.title);
      expect(res.body.data.event.capacity).toBe(500);
      expect(res.body.data.event.timezone).toBe('America/New_York');
      expect(res.body.data.event.status).toBe('published');
    });

    it('PUT fails if any required field is omitted', async () => {
      const incompleteUpdate = {
        title: 'Only Title and Description',
        description: 'Missing other required fields',
      };

      const res = await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(incompleteUpdate);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('PATCH allows partial updates without affecting unmodified fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({
          title: 'Patched Title Only',
          capacity: 300,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.title).toBe('Patched Title Only');
      expect(res.body.data.event.capacity).toBe(300);
      // Other fields should remain unchanged
      expect(res.body.data.event.description).toBe(sampleEventData.description);
      expect(res.body.data.event.timezone).toBe(sampleEventData.timezone);
      expect(res.body.data.event.location).toBe(sampleEventData.location);
    });

    it('PATCH fails when an empty body is sent', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('Canceled Event Status Rule', () => {
    it('status cannot move out of canceled once an event is canceled', async () => {
      // Create and cancel event
      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(sampleEventData);
      const eventId = createRes.body.data.event.id;

      // Cancel the event via PATCH
      const cancelRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({ status: 'canceled' });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.event.status).toBe('canceled');

      // Attempt to move back to published via PATCH
      const unCancelPatchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({ status: 'published' });
      expect(unCancelPatchRes.status).toBe(400);
      expect(unCancelPatchRes.body.success).toBe(false);
      expect(unCancelPatchRes.body.message).toMatch(/canceled/i);

      // Attempt to move back to draft via PUT
      const unCancelPutRes = await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send({
          ...sampleEventData,
          status: 'draft',
        });
      expect(unCancelPutRes.status).toBe(400);
      expect(unCancelPutRes.body.success).toBe(false);
      expect(unCancelPutRes.body.message).toMatch(/canceled/i);
    });
  });

  describe('DELETE /api/v1/events/:id', () => {
    it('should allow organizer to delete their own event', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Cookie', [`accessToken=${tokenAlice}`])
        .send(sampleEventData);
      const eventId = createRes.body.data.event.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Cookie', [`accessToken=${tokenAlice}`]);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.message).toBe('Event deleted successfully');

      // Check DB (soft deleted)
      const check = await prisma.event.findUnique({ where: { id: eventId } });
      expect(check).not.toBeNull();
      expect(check?.deletedAt).not.toBeNull();
      expect(check?.status).toBe('canceled');
    });
  });
});
