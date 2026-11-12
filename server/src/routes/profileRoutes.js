import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', [
  body('name').optional().trim().isLength({ min: 1, max: 60 }),
  body('avatar').optional().isString().isLength({ max: 2048 }),
], validate, updateProfile);
router.put(
  '/password',
  [
    body('currentPassword').optional({ values: 'falsy' }).isString(),
    body('newPassword').isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters'),
  ],
  validate,
  changePassword
);

export default router;
