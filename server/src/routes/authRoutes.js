import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPasswordController,
  logout,
  getMe,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 1, max: 60 }).withMessage('Name must be 1–60 characters'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/google', authLimiter, [body('credential').isString().notEmpty()], validate, googleLogin);
router.post('/verify-email', authLimiter, [body('token').isString().notEmpty()], validate, verifyEmail);
router.post('/resend-verification', authLimiter, [body('email').isEmail().normalizeEmail()], validate, resendVerificationEmail);
router.post('/forgot-password', authLimiter, [body('email').isEmail().normalizeEmail()], validate, forgotPassword);
router.post('/reset-password', authLimiter, [
  body('token').isString().notEmpty(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
], validate, resetPasswordController);

router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
