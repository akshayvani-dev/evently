import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import registrationRoutes from './registration.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/users', userRoutes);

export default router;
