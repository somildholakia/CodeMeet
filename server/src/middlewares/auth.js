import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new ApiError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (!user.emailVerified) throw new ApiError(403, 'Please verify your email address before using CodeMeet.');
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw new ApiError(401, 'Your password changed. Please log in again.');
  }

  req.user = user;
  next();
});
