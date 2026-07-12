import { Router } from 'express';
import {
  createMeeting,
  listMeetings,
  getMeeting,
  deleteMeeting,
} from '../controllers/meetingController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/', createMeeting);
router.get('/', listMeetings);
router.get('/:id', getMeeting);
router.delete('/:id', deleteMeeting);

export default router;
