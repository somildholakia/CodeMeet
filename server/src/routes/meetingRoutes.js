import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMeeting,
  listMeetings,
  getMeeting,
  deleteMeeting,
} from '../controllers/meetingController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(requireAuth);

router.post('/', [body('title').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('Meeting title must be 120 characters or fewer')], validate, createMeeting);
router.get('/', listMeetings);
router.get('/:id', getMeeting);
router.delete('/:id', deleteMeeting);

export default router;
