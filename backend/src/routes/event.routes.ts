import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  createEventSchema,
  patchEventSchema,
  updateEventSchema,
} from '../validators/event.validator';

const router = Router();

// All event management endpoints require authentication and the organizer role
router.use(authenticate, authorize('organizer'));

router.post('/', validate(createEventSchema), EventController.create);
router.put('/:id', validate(updateEventSchema), EventController.update);
router.patch('/:id', validate(patchEventSchema), EventController.patch);
router.delete('/:id', EventController.delete);

export default router;
