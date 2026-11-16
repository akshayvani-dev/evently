import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  createEventSchema,
  patchEventSchema,
  updateEventSchema,
} from '../validators/event.validator';

const router = Router();

// Public event listing defaults to upcoming/published events.
router.get('/public', optionalAuthenticate, EventController.list);
router.get('/public/:id', optionalAuthenticate, EventController.getPublicById);
router.get('/', authenticate, authorize('organizer'), EventController.listMine);
router.get('/:id', authenticate, authorize('organizer'), EventController.getById);
// Attendee: Register for an event
router.post(
  '/:eventId/registrations',
  authenticate,
  authorize('attendee'),
  RegistrationController.register
);

// Organizer: List active attendees for own event
router.get(
  '/:eventId/registrations',
  authenticate,
  authorize('organizer'),
  RegistrationController.getEventAttendees
);

// Organizer: Event CRUD
router.post(
  '/',
  authenticate,
  authorize('organizer'),
  validate(createEventSchema),
  EventController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('organizer'),
  validate(updateEventSchema),
  EventController.update
);

router.patch(
  '/:id',
  authenticate,
  authorize('organizer'),
  validate(patchEventSchema),
  EventController.patch
);

router.delete('/:id', authenticate, authorize('organizer'), EventController.delete);

export default router;
