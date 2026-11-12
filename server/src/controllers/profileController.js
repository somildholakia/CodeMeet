import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...(name && { name }), ...(avatar && { avatar }) } },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (user.password) {
    const isMatch = await bcrypt.compare(currentPassword || '', user.password);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect');
  } else if (!(user.authMethods || []).includes('google')) {
    throw new ApiError(400, 'This account cannot set a password right now');
  }

  user.password = newPassword;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.authMethods = [...new Set([...(user.authMethods || []), 'password'])];
  await user.save();

  res.json({ success: true, message: 'Password updated' });
});
