import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { EventService } from '../services/event.service';
import { publicEventListQuerySchema } from '../validators/event.validator';

export class EventController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = publicEventListQuerySchema.safeParse(req.query);
      if (!query.success) {
        throw new AppError(400, 'Validation failed', query.error.flatten().fieldErrors);
      }

      const events = await EventService.listEvents('published', undefined, query.data);
      res.status(200).json({ success: true, data: { events } });
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedStatus = req.query.status;
      const allowed = ['all', 'published', 'draft', 'canceled', 'completed'] as const;
      const status = typeof requestedStatus === 'string' && allowed.includes(requestedStatus as (typeof allowed)[number])
        ? requestedStatus as (typeof allowed)[number]
        : 'all';
      const events = await EventService.listEvents(status, req.user!.id);
      res.status(200).json({ success: true, data: { events } });
    } catch (error) {
      next(error);
    }
  }
  static async getPublicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.getEventById(eventId);
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
