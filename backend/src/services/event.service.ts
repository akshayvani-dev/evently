import { Event, Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import {
  CreateEventInput,
  PatchEventInput,
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
