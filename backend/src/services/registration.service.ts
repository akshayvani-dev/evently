import { Prisma, Registration } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import {
  ListEventAttendeesQuery,
  ListUserRegistrationsQuery,
} from '../validators/registration.validator';

interface LockedEventRegistrationRow {
  id: string;
  title: string;
  capacity: number;
  status: string;
  startAt: Date;
  deletedAt: Date | null;
}

export class RegistrationService {
  static async register(eventId: string, userId: string): Promise<Registration> {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the event row
      const locked = await tx.$queryRaw<LockedEventRegistrationRow[]>`
        SELECT id, title, capacity, status, "startAt", "deletedAt"
        FROM "Event"
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      // 2. Check event is published
      if (event.status !== 'published') {
        throw new AppError(409, 'Event is not open for registration');
      }

      // 3. Check event hasn't started yet
      if (new Date(event.startAt).getTime() <= Date.now()) {
        throw new AppError(409, 'Event has already started');
      }

      // 4. Check duplicate active registration
      const existing = await tx.registration.findFirst({
        where: {
          eventId,
          userId,
          status: 'active',
        },
      });

      if (existing) {
        throw new AppError(409, 'You already have an active registration for this event');
      }

      // 5. Check capacity against active registrations count
      const activeCount = await tx.registration.count({
        where: {
          eventId,
          status: 'active',
        },
      });

      if (activeCount >= event.capacity) {
        throw new AppError(409, 'Event is full');
      }

      // 6. Create registration
      return tx.registration.create({
        data: {
          eventId,
          userId,
          status: 'active',
        },
      });
    });
  }

  static async cancelRegistration(
    registrationId: string,
    userId: string
  ): Promise<Registration> {
    return prisma.$transaction(async (tx) => {
      // 1. Find registration
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        throw new AppError(404, 'Registration not found');
      }

      // 2. Ownership check
      if (registration.userId !== userId) {
        throw new AppError(403, 'Forbidden: you can only cancel your own registration');
      }

      // 3. Status check
      if (registration.status !== 'active') {
        throw new AppError(400, 'Registration is already canceled');
      }

      // 4. Lock event row to check startAt and deletedAt
      const locked = await tx.$queryRaw<LockedEventRegistrationRow[]>`
        SELECT id, title, capacity, status, "startAt", "deletedAt"
        FROM "Event"
        WHERE id = ${registration.eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      // 5. Must cancel before the event starts
      if (new Date(event.startAt).getTime() <= Date.now()) {
        throw new AppError(409, 'Event has already started');
      }

      // 6. Soft cancel registration
      return tx.registration.update({
        where: { id: registrationId },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          canceledBy: userId,
        },
      });
    });
  }

  static async getUserRegistrations(
    userId: string,
    query: ListUserRegistrationsQuery
  ) {
    const where: Prisma.RegistrationWhereInput = {
      userId,
      event: {
        deletedAt: null,
      },
      ...(query.status ? { status: query.status } : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              startAt: true,
              timezone: true,
              location: true,
              capacity: true,
              status: true,
            },
          },
        },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.registration.count({ where }),
    ]);

    return {
      registrations,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  static async getEventAttendees(
    eventId: string,
    organizerId: string,
    query: ListEventAttendeesQuery
  ) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new AppError(
        403,
        'Forbidden: you do not have permission to view registrations for this event'
      );
    }

    const where: Prisma.RegistrationWhereInput = {
      eventId,
      status: 'active',
    };

    const skip = (query.page - 1) * query.limit;

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { registeredAt: 'asc' },
        skip,
        take: query.limit,
      }),
      prisma.registration.count({ where }),
    ]);

    const attendees = registrations.map((r) => ({
      id: r.id,
      name: r.user.name,
      email: r.user.email,
      registeredAt: r.registeredAt,
    }));

    return {
      attendees,
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
