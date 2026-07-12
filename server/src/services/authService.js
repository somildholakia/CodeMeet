import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  return user;
}

export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  return user;
}
