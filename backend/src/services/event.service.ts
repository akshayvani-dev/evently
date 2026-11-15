import { Event, Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';
import {
  CreateEventInput,
  PatchEventInput,
  UpdateEventInput,
} from '../validators/event.validator';

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
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
    }

    // Status can't move out of canceled once an event is canceled
    if (event.status === 'canceled' && input.status !== 'canceled') {
      throw new AppError(400, 'Status cannot be changed once an event is canceled');
    }

    // TODO: capacity cannot be reduced below active registrations (to be enforced once registrations are implemented)

    return prisma.event.update({
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
  }

  static async patchEvent(
    eventId: string,
    organizerId: string,
    input: PatchEventInput
  ): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
    }

    // Status can't move out of canceled once an event is canceled
    if (event.status === 'canceled' && input.status !== undefined && input.status !== 'canceled') {
      throw new AppError(400, 'Status cannot be changed once an event is canceled');
    }

    if (input.capacity !== undefined) {
      // TODO: capacity cannot be reduced below active registrations (to be enforced once registrations are implemented)
    }

    const data: Prisma.EventUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.startAt !== undefined) data.startAt = new Date(input.startAt);
    if (input.timezone !== undefined) data.timezone = input.timezone;
    if (input.location !== undefined) data.location = input.location;
    if (input.capacity !== undefined) data.capacity = input.capacity;
    if (input.status !== undefined) data.status = input.status;

    return prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  static async deleteEvent(eventId: string, organizerId: string): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new AppError(403, 'Forbidden: you do not have permission to manage this event');
    }

    await prisma.event.delete({
      where: { id: eventId },
    });
  }
}
