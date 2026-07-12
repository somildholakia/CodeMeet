import { Router } from 'express';
import { body } from 'express-validator';
import { execute } from '../controllers/executionController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  [
    body('meetingId').notEmpty(),
    body('language').notEmpty(),
    body('code').notEmpty(),
  ],
  validate,
  execute
);

export default router;
