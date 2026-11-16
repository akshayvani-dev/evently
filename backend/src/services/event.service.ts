import { Event, Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import {
  CreateEventInput,
  EventListFilters,
  PatchEventInput,
  UpdateEventInput,
} from '../validators/event.validator';

interface LockedEventRow {
  id: string;
  organizerId: string;
  status: string;
  capacity: number;
  startAt: Date;
  deletedAt: Date | null;
}

export class EventService {
  static async listEvents(
    status: 'all' | 'published' | 'draft' | 'canceled' | 'completed',
    organizerId?: string,
    filters: EventListFilters = { page: 1, limit: 20 },
    attendeeId?: string,
  ) {
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "events"
      SET "status" = 'completed'::"EventStatus"
      WHERE "status" = 'published'::"EventStatus"
        AND "start_at" <= ${now}
        AND "deleted_at" IS NULL
    `;

    const dateFilterEnd = filters.dateFilter === 'this-week'
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      : filters.dateFilter === 'this-month'
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : filters.dateFilter === 'next-3-months'
          ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
          : null;

    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      ...(organizerId ? { organizerId } : {}),
      ...(filters.title ? { title: { contains: filters.title, mode: 'insensitive' } } : {}),
      ...(dateFilterEnd ? { startAt: { gte: now, lte: dateFilterEnd } } : {}),
      ...(status === 'all' ? {} : { status }),
    };
    const skip = (filters.page - 1) * filters.limit;
    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
        include: {
          organizer: { select: { name: true } },
          registrations: { where: { status: 'active' }, select: { id: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const registrationStatuses = new Map<string, 'active' | 'canceled'>();
    if (attendeeId && events.length > 0) {
      const registrations = await prisma.registration.findMany({
        where: {
          userId: attendeeId,
          eventId: { in: events.map((event) => event.id) },
        },
        select: { eventId: true, status: true },
        orderBy: { registeredAt: 'desc' },
      });

      for (const registration of registrations) {
        if (!registrationStatuses.has(registration.eventId)) {
          registrationStatuses.set(registration.eventId, registration.status);
        }
      }
    }

    return {
      events: events.map(({ organizer, registrations, ...event }) => {
        const eventData = {
          ...event,
          organizerName: organizer.name,
          registered: registrations.length,
        };
        return attendeeId
          ? {
              ...eventData,
              registrationStatus: registrationStatuses.get(event.id) ?? null,
            }
          : eventData;
      }),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: skip + events.length < total,
      },
    };
  }
  static async getEventById(eventId: string, organizerId?: string, attendeeId?: string) {
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "events"
      SET "status" = 'completed'::"EventStatus"
      WHERE "status" = 'published'::"EventStatus"
        AND "start_at" <= ${now}
        AND "deleted_at" IS NULL
    `;

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        ...(organizerId ? { organizerId } : {}),
      },
      include: {
        organizer: { select: { name: true } },
        registrations: { where: { status: 'active' }, select: { id: true } },
      },
    });

    if (!event || (!organizerId && event.status !== 'published' && event.status !== 'completed')) {
      throw new AppError(404, 'Event not found');
    }

    const registration = attendeeId
      ? await prisma.registration.findFirst({
          where: { eventId, userId: attendeeId },
          select: { id: true, status: true },
          orderBy: { registeredAt: 'desc' },
        })
      : null;

    const { organizer, registrations, ...eventData } = event;
    const result = {
      ...eventData,
      organizerName: organizer.name,
      registered: registrations.length,
    };
    return attendeeId
      ? {
          ...result,
          registrationId: registration?.id ?? null,
          registrationStatus: registration?.status ?? null,
        }
      : result;
  }
  static async createEvent(
    organizerId: string,
    input: CreateEventInput
  ): Promise<Event> {
    return prisma.event.create({
      data: {
        organizerId,
        title: input.title,
        description: input.description,
        startAt: new Date(input.startAt),
        timezone: input.timezone,
        location: input.location,
        capacity: input.capacity,
        status: input.status,
      },
    });
  }

  static async updateEvent(
    eventId: string,
    organizerId: string,
    input: UpdateEventInput
  ): Promise<Event> {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedEventRow[]>`
        SELECT
          "id",
          "organizer_id" AS "organizerId",
          "status",
          "capacity",
          "start_at" AS "startAt",
          "deleted_at" AS "deletedAt"
        FROM "events"
        WHERE "id" = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      if (event.organizerId !== organizerId) {
        throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
      }

      if (event.startAt.getTime() <= Date.now()) {
        throw new AppError(400, 'Cannot modify an event after it has started');
      }

      // Block edits on canceled or deleted events
      if (event.status === 'canceled') {
        throw new AppError(400, 'Cannot modify a canceled event');
      }

      // Capacity update: reject if below active registration count
      if (input.capacity !== undefined) {
        const activeCount = await tx.registration.count({
          where: { eventId, status: 'active' },
        });
        if (input.capacity < activeCount) {
          throw new AppError(
            400,
            `Capacity cannot be reduced below active registration count (${activeCount})`
          );
        }
      }

      // Event cancel: bulk-cancel active registrations with canceledBy = organizer id
      if (input.status === 'canceled') {
        await tx.registration.updateMany({
          where: { eventId, status: 'active' },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
            canceledBy: organizerId,
          },
        });
      }

      return tx.event.update({
        where: { id: eventId },
        data: {
          title: input.title,
          description: input.description,
          startAt: new Date(input.startAt),
          timezone: input.timezone,
          location: input.location,
          capacity: input.capacity,
          status: input.status,
        },
      });
    });
  }

  static async patchEvent(
    eventId: string,
    organizerId: string,
    input: PatchEventInput
  ): Promise<Event> {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedEventRow[]>`
        SELECT
          "id",
          "organizer_id" AS "organizerId",
          "status",
          "capacity",
          "start_at" AS "startAt",
          "deleted_at" AS "deletedAt"
        FROM "events"
        WHERE "id" = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      if (event.organizerId !== organizerId) {
        throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
      }

      if (event.startAt.getTime() <= Date.now()) {
        throw new AppError(400, 'Cannot modify an event after it has started');
      }

      // Block edits on canceled or deleted events
      if (event.status === 'canceled') {
        throw new AppError(400, 'Cannot modify a canceled event');
      }

      // Capacity update: reject if below active registration count
      if (input.capacity !== undefined) {
        const activeCount = await tx.registration.count({
          where: { eventId, status: 'active' },
        });
        if (input.capacity < activeCount) {
          throw new AppError(
            400,
            `Capacity cannot be reduced below active registration count (${activeCount})`
          );
        }
      }

      // Event cancel: bulk-cancel active registrations with canceledBy = organizer id
      if (input.status === 'canceled') {
        await tx.registration.updateMany({
          where: { eventId, status: 'active' },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
            canceledBy: organizerId,
          },
        });
      }

      const data: Prisma.EventUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.startAt !== undefined) data.startAt = new Date(input.startAt);
      if (input.timezone !== undefined) data.timezone = input.timezone;
      if (input.location !== undefined) data.location = input.location;
      if (input.capacity !== undefined) data.capacity = input.capacity;
      if (input.status !== undefined) data.status = input.status;

      return tx.event.update({
        where: { id: eventId },
        data,
      });
    });
  }

  static async deleteEvent(eventId: string, organizerId: string): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedEventRow[]>`
        SELECT
          "id",
          "organizer_id" AS "organizerId",
          "status",
          "capacity",
          "start_at" AS "startAt",
          "deleted_at" AS "deletedAt"
        FROM "events"
        WHERE "id" = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      if (event.organizerId !== organizerId) {
        throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
      }

      if (event.startAt.getTime() <= Date.now()) {
        throw new AppError(400, 'Cannot modify an event after it has started');
      }

      // Soft delete: set deletedAt, status = canceled
      await tx.event.update({
        where: { id: eventId },
        data: {
          deletedAt: new Date(),
          status: 'canceled',
        },
      });

      // Bulk-cancel active registrations with canceledBy = organizer id
      await tx.registration.updateMany({
        where: { eventId, status: 'active' },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          canceledBy: organizerId,
        },
      });
    });
  }
}
