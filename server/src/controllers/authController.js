import { registerUser, authenticateUser } from '../services/authService.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    meetingsHosted: user.meetingsHosted,
    meetingsJoined: user.meetingsJoined,
  };
}

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.status(201).json({ success: true, user: serializeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.json({ success: true, user: serializeUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: serializeUser(req.user) });
});
