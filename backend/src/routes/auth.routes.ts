import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import { signinSchema, signupSchema } from '../validators/auth.validator';

const router = Router();

router.post(
  '/signup',
  authRateLimiter,
  validate(signupSchema),
  AuthController.signup
);

router.post(
  '/signin',
  authRateLimiter,
  validate(signinSchema),
  AuthController.signin
);

router.post('/logout', AuthController.logout);

router.post('/refresh', authRateLimiter, AuthController.refresh);

router.get('/me', authenticate, AuthController.me);

export default router;
