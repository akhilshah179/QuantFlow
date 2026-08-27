import { Router } from 'express';
import { register, login, googleAuth, forgotPassword, resetPassword, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// /me endpoint is for verifying session state and does not count against auth attempt rate limit
router.get('/me', authMiddleware, getMe);

// Apply rate limiter to login/register/password-reset endpoints
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleAuth);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

export default router;

