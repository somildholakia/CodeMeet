import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put(
  '/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

export default router;
