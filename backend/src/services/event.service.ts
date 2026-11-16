import { Event, Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import {
  CreateEventInput,
  PatchEventInput,
  PublicEventListQuery,
  UpdateEventInput,
} from '../validators/event.validator';

interface LockedEventRow {
  id: string;
  organizerId: string;
  status: string;
  capacity: number;
  deletedAt: Date | null;
}

export class EventService {
  static async listEvents(
    status: 'all' | 'published' | 'draft' | 'canceled' | 'completed',
    organizerId?: string,
    filters: PublicEventListQuery = {},
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

    const completedIds = status === 'completed'
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "events"
          WHERE "status" = 'completed'::"EventStatus"
            AND "deleted_at" IS NULL
        `
      : null;
    const events = await prisma.event.findMany({
      where: {
        deletedAt: null,
        ...(organizerId ? { organizerId } : {}),
        ...(filters.title ? { title: { contains: filters.title, mode: 'insensitive' } } : {}),
        ...(dateFilterEnd ? { startAt: { gte: now, lte: dateFilterEnd } } : {}),
        ...(status === 'all'
          ? {}
          : status === 'completed'
            ? { id: { in: completedIds?.map(({ id }) => id) ?? [] } }
            : { status }),
      },
      orderBy: { startAt: 'desc' },
      include: {
        organizer: { select: { name: true } },
        registrations: { where: { status: 'active' }, select: { id: true } },
      },
    });

    return events.map(({ organizer, registrations, ...event }) => ({
      ...event,
      organizerName: organizer.name,
      registered: registrations.length,
    }));
  }
  static async getEventById(eventId: string, organizerId?: string) {
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

    const { organizer, registrations, ...eventData } = event;
    return {
      ...eventData,
      organizerName: organizer.name,
      registered: registrations.length,
    };
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
        SELECT id, "organizerId", status, capacity, "deletedAt"
        FROM "Event"
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      if (event.organizerId !== organizerId) {
        throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
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
        SELECT id, "organizerId", status, capacity, "deletedAt"
        FROM "Event"
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      if (event.organizerId !== organizerId) {
        throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
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
        SELECT id, "organizerId", status, capacity, "deletedAt"
        FROM "Event"
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!locked.length || locked[0].deletedAt !== null) {
        throw new AppError(404, 'Event not found');
      }

      const event = locked[0];

      if (event.organizerId !== organizerId) {
        throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
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
