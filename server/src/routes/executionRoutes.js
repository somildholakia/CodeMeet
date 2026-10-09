import { Router } from 'express';
import { body } from 'express-validator';
import { execute } from '../controllers/executionController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(requireAuth);
router.post(
  '/',
  rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many code runs. Please wait a minute.' } }),
  [
    body('meetingId').isString().trim().notEmpty().withMessage('Meeting ID is required'),
    body('language').isIn(['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust']).withMessage('Unsupported language'),
    body('code').isString().trim().notEmpty().isLength({ max: 20000 }).withMessage('Code is required and must be at most 20,000 characters'),
    body('stdin').optional().isString().isLength({ max: 5000 }).withMessage('Input must be at most 5,000 characters'),
  ],
  validate,
  execute
);
export default router;
