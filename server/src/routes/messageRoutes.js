import { Router } from 'express';
import { body } from 'express-validator';
import { getMessages, postMessage } from '../controllers/messageController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/:meetingId', getMessages);
router.post(
  '/',
  [body('meetingId').notEmpty(), body('text').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  postMessage
);

export default router;
