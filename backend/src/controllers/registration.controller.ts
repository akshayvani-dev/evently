import { NextFunction, Request, Response } from 'express';
import { RegistrationService } from '../services/registration.service';
import {
  listEventAttendeesQuerySchema,
  listUserRegistrationsQuerySchema,
} from '../validators/registration.validator';

export class RegistrationController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.eventId)
        ? req.params.eventId[0]
        : req.params.eventId;
      const registration = await RegistrationService.register(eventId, req.user!.id);
      res.status(201).json({
        success: true,
        data: {
          registration,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const registration = await RegistrationService.cancelRegistration(id, req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          registration,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserRegistrations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = listUserRegistrationsQuerySchema.parse(req.query);
      const result = await RegistrationService.getUserRegistrations(req.user!.id, query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventAttendees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.eventId)
        ? req.params.eventId[0]
        : req.params.eventId;
      const query = listEventAttendeesQuerySchema.parse(req.query);
      const result = await RegistrationService.getEventAttendees(
        eventId,
        req.user!.id,
        query
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
