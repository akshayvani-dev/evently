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

describe('Event Registration Integration Tests', () => {
  const organizerUser = {
    name: 'Org Alice',
    email: 'alice.org@evently.test',
    password: 'Password123!',
    role: 'organizer' as const,
  };

  const organizerOther = {
    name: 'Org Bob',
    email: 'bob.org@evently.test',
    password: 'Password123!',
    role: 'organizer' as const,
  };

  const attendeeA = {
    name: 'Attendee Amy',
    email: 'amy.att@evently.test',
    password: 'Password123!',
    role: 'attendee' as const,
  };

  const attendeeB = {
    name: 'Attendee Ben',
    email: 'ben.att@evently.test',
    password: 'Password123!',
    role: 'attendee' as const,
  };

  let tokenOrganizer: string;
  let tokenOrganizerOther: string;
  let tokenAttendeeA: string;
  let tokenAttendeeB: string;

  const validFutureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  beforeEach(async () => {
    await prisma.registration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const resOrg = await request(app).post('/api/auth/signup').send(organizerUser);
    tokenOrganizer = getCookieValue(resOrg, 'accessToken')!;

    const resOrgOther = await request(app).post('/api/auth/signup').send(organizerOther);
    tokenOrganizerOther = getCookieValue(resOrgOther, 'accessToken')!;

    const resAttA = await request(app).post('/api/auth/signup').send(attendeeA);
    tokenAttendeeA = getCookieValue(resAttA, 'accessToken')!;

    const resAttB = await request(app).post('/api/auth/signup').send(attendeeB);
    tokenAttendeeB = getCookieValue(resAttB, 'accessToken')!;
  });

  const createEvent = async (
    token: string,
    overrides: Partial<{
      title: string;
      description: string;
      startAt: string;
      timezone: string;
      location: string;
      capacity: number;
      status: 'draft' | 'published' | 'canceled';
    }> = {}
  ) => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', [`accessToken=${token}`])
      .send({
        title: 'Developer Workshop',
        description: 'Hands-on coding workshop',
        startAt: validFutureDate,
        timezone: 'UTC',
        location: 'Lab 101',
        capacity: 10,
        status: 'published',
        ...overrides,
      });
    return res.body.data.event;
  };

  describe('Duplicate & Capacity & Place Freeing', () => {
    it('duplicate active registration is rejected with 409', async () => {
      const event = await createEvent(tokenOrganizer);

      const res1 = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.registration.status).toBe('active');

      const res2 = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res2.status).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toMatch(/already have an active registration/i);
    });

    it('full event rejected and cancel frees a place', async () => {
      const event = await createEvent(tokenOrganizer, { capacity: 1 });

      // Amy registers -> succeeds
      const resA = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);
      expect(resA.status).toBe(201);
      const regAId = resA.body.data.registration.id;

      // Ben registers -> fails (Event is full)
      const resB = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeB}`]);
      expect(resB.status).toBe(409);
      expect(resB.body.message).toMatch(/full/i);

      // Amy cancels her registration
      const cancelRes = await request(app)
        .patch(`/api/registrations/${regAId}/cancel`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.registration.status).toBe('canceled');
      expect(cancelRes.body.data.registration.canceledAt).toBeDefined();

      // Ben registers again -> now succeeds!
      const resB2 = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeB}`]);
      expect(resB2.status).toBe(201);
      expect(resB2.body.data.registration.status).toBe('active');
    });
  });

  describe('Concurrency & Race Condition', () => {
    it('10 concurrent registrations on capacity 1 -> exactly 1 succeeds and 9 fail', async () => {
      const event = await createEvent(tokenOrganizer, { capacity: 1 });

      // Create 10 attendee tokens
      const attendeeTokens: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const res = await request(app).post('/api/auth/signup').send({
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@evently.test`,
          password: 'Password123!',
          role: 'attendee',
        });
        attendeeTokens.push(getCookieValue(res, 'accessToken')!);
      }

      // Fire 10 concurrent requests
      const results = await Promise.all(
        attendeeTokens.map((token) =>
          request(app)
            .post(`/api/events/${event.id}/registrations`)
            .set('Cookie', [`accessToken=${token}`])
        )
      );

      const successful = results.filter((r) => r.status === 201);
      const rejected = results.filter((r) => r.status === 409);

      expect(successful.length).toBe(1);
      expect(rejected.length).toBe(9);

      // Verify database has exactly 1 active registration
      const activeCount = await prisma.registration.count({
        where: { eventId: event.id, status: 'active' },
      });
      expect(activeCount).toBe(1);
    });
  });

  describe('Eligibility Checks (Draft, Canceled, Deleted, Started)', () => {
    it('cannot register for a draft event', async () => {
      const event = await createEvent(tokenOrganizer, { status: 'draft' });

      const res = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/not open/i);
    });

    it('cannot register for a canceled event', async () => {
      const event = await createEvent(tokenOrganizer, { status: 'canceled' });

      const res = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/not open/i);
    });

    it('cannot register for a deleted event (returns 404)', async () => {
      const event = await createEvent(tokenOrganizer);

      // Soft delete event
      await request(app)
        .delete(`/api/events/${event.id}`)
        .set('Cookie', [`accessToken=${tokenOrganizer}`]);

      const res = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('cannot register for an event that has already started', async () => {
      // Create event in the past directly in DB to simulate already started event
      const pastEvent = await prisma.event.create({
        data: {
          organizerId: (await prisma.user.findFirst({ where: { email: organizerUser.email } }))!.id,
          title: 'Past Event',
          description: 'Yesterday event',
          startAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          timezone: 'UTC',
          location: 'Main Hall',
          capacity: 50,
          status: 'published',
        },
      });

      const res = await request(app)
        .post(`/api/events/${pastEvent.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already started/i);
    });
  });

  describe('Ownership Checks (Attendee List & Cancel)', () => {
    it('attendee B cannot cancel attendee A registration', async () => {
      const event = await createEvent(tokenOrganizer);

      const regRes = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);
      const regId = regRes.body.data.registration.id;

      const cancelRes = await request(app)
        .patch(`/api/registrations/${regId}/cancel`)
        .set('Cookie', [`accessToken=${tokenAttendeeB}`]);

      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.message).toMatch(/forbidden/i);
    });

    it('organizer B cannot view attendee list of organizer A event', async () => {
      const event = await createEvent(tokenOrganizer);

      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      const res = await request(app)
        .get(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenOrganizerOther}`]);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('organizer can view active attendees of own event', async () => {
      const event = await createEvent(tokenOrganizer);

      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      const res = await request(app)
        .get(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenOrganizer}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attendees).toBeDefined();
      expect(res.body.data.attendees.length).toBe(1);
      expect(res.body.data.attendees[0].name).toBe(attendeeA.name);
      expect(res.body.data.attendees[0].email).toBe(attendeeA.email);
      expect(res.body.data.attendees[0].registeredAt).toBeDefined();
    });

    it('attendee can list own registrations with event details', async () => {
      const event = await createEvent(tokenOrganizer);

      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      const res = await request(app)
        .get('/api/users/me/registrations')
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registrations).toBeDefined();
      expect(res.body.data.registrations.length).toBe(1);
      expect(res.body.data.registrations[0].status).toBe('active');
      expect(res.body.data.registrations[0].event.title).toBe(event.title);
    });
  });

  describe('Event Cancel & Delete Bulk-Cancels Registrations', () => {
    it('canceling an event bulk-cancels registrations with canceledBy = organizer id', async () => {
      const event = await createEvent(tokenOrganizer);
      const organizerRecord = await prisma.user.findFirst({
        where: { email: organizerUser.email },
      });

      // Register Amy and Ben
      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);
      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeB}`]);

      // Organizer cancels the event via PATCH
      const patchRes = await request(app)
        .patch(`/api/events/${event.id}`)
        .set('Cookie', [`accessToken=${tokenOrganizer}`])
        .send({ status: 'canceled' });

      expect(patchRes.status).toBe(200);

      // Verify all registrations for this event are now canceled with canceledBy = organizer id
      const registrations = await prisma.registration.findMany({
        where: { eventId: event.id },
      });

      expect(registrations.length).toBe(2);
      for (const reg of registrations) {
        expect(reg.status).toBe('canceled');
        expect(reg.canceledAt).not.toBeNull();
        expect(reg.canceledBy).toBe(organizerRecord?.id);
      }
    });

    it('deleting an event bulk-cancels registrations with canceledBy = organizer id and soft-deletes event', async () => {
      const event = await createEvent(tokenOrganizer);
      const organizerRecord = await prisma.user.findFirst({
        where: { email: organizerUser.email },
      });

      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);

      const deleteRes = await request(app)
        .delete(`/api/events/${event.id}`)
        .set('Cookie', [`accessToken=${tokenOrganizer}`]);

      expect(deleteRes.status).toBe(200);

      // Verify soft delete
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent?.deletedAt).not.toBeNull();
      expect(deletedEvent?.status).toBe('canceled');

      // Verify registration canceled with canceledBy
      const reg = await prisma.registration.findFirst({
        where: { eventId: event.id },
      });
      expect(reg?.status).toBe('canceled');
      expect(reg?.canceledBy).toBe(organizerRecord?.id);
    });
  });

  describe('Capacity Updates vs Active Registrations', () => {
    it('capacity update rejected if reduced below active registration count', async () => {
      const event = await createEvent(tokenOrganizer, { capacity: 5 });

      // Register Amy and Ben (2 active)
      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeA}`]);
      await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Cookie', [`accessToken=${tokenAttendeeB}`]);

      // Attempt reducing capacity to 1 (below 2 active) -> fails with 400
      const patchFail = await request(app)
        .patch(`/api/events/${event.id}`)
        .set('Cookie', [`accessToken=${tokenOrganizer}`])
        .send({ capacity: 1 });

      expect(patchFail.status).toBe(400);
      expect(patchFail.body.message).toMatch(/cannot be reduced below active registration count/i);

      // Attempt setting capacity to 2 (equal to active) -> succeeds
      const patchSuccess = await request(app)
        .patch(`/api/events/${event.id}`)
        .set('Cookie', [`accessToken=${tokenOrganizer}`])
        .send({ capacity: 2 });

      expect(patchSuccess.status).toBe(200);
      expect(patchSuccess.body.data.event.capacity).toBe(2);
    });
  });
});
