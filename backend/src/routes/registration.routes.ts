import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Attendee: Cancel own registration
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('attendee'),
  RegistrationController.cancel
);

export default router;
