import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Attendee: Get own registrations
router.get(
  '/me/registrations',
  authenticate,
  authorize('attendee'),
  RegistrationController.getUserRegistrations
);

export default router;
