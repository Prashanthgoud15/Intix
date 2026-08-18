import { Router } from 'express';
import authController from '../../controllers/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
} from '../../validators/auth.validators.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply auth rate limiter only to login/register/refresh, NOT to /me

router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    authController.register
);

router.post(
    '/login',
    authLimiter,
    validate(loginSchema),
    authController.login
);

router.post(
    '/refresh',
    authLimiter,
    validate(refreshTokenSchema),
    authController.refresh
);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

export default router;
