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
  if ((payload.sv ?? 0) !== (user.sessionVersion ?? 0)) {
    throw new ApiError(401, 'Your account security settings changed. Please log in again.');
  }

  req.user = user;
  next();
});
