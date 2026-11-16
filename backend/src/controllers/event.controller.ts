import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { EventService } from '../services/event.service';
import {
  organizerEventListQuerySchema,
  publicEventListQuerySchema,
} from '../validators/event.validator';

export class EventController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = publicEventListQuerySchema.safeParse(req.query);
      if (!query.success) {
        throw new AppError(400, 'Validation failed', query.error.flatten().fieldErrors);
      }

      const attendeeId = req.user?.role === 'attendee' ? req.user.id : undefined;
      const result = await EventService.listEvents('published', undefined, query.data, attendeeId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = organizerEventListQuerySchema.safeParse(req.query);
      if (!query.success) {
        throw new AppError(400, 'Validation failed', query.error.flatten().fieldErrors);
      }

      const { status, ...filters } = query.data;
      const result = await EventService.listEvents(status, req.user!.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
  static async getPublicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const attendeeId = req.user?.role === 'attendee' ? req.user.id : undefined;
      const event = await EventService.getEventById(eventId, undefined, attendeeId);
      res.status(200).json({ success: true, data: { event } });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.getEventById(eventId, req.user!.id);
      res.status(200).json({ success: true, data: { event } });
    } catch (error) {
      next(error);
    }
  }
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.createEvent(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: {
          event,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.updateEvent(eventId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        data: {
          event,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.patchEvent(eventId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        data: {
          event,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await EventService.deleteEvent(eventId, req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          message: 'Event deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
