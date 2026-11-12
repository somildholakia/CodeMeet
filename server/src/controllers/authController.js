import {
  registerUser,
  authenticateUser,
  authenticateGoogle,
  verifyEmailToken,
  resendVerification,
  requestPasswordReset,
  resetPassword,
} from '../services/authService.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    emailVerified: Boolean(user.emailVerified),
    authMethods: user.authMethods || [],
    meetingsHosted: user.meetingsHosted,
    meetingsJoined: user.meetingsJoined,
  };
}

function startSession(res, user) {
  const token = signToken(user._id);
  setAuthCookie(res, token);
  return { user: serializeUser(user), socketToken: token };
}

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  res.status(201).json({
    success: true,
    needsVerification: true,
    email: result.email,
    message: 'Check your inbox for a verification link to activate your account.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  res.json({ success: true, ...startSession(res, user) });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const user = await authenticateGoogle(req.body.credential);
  res.json({ success: true, ...startSession(res, user) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const email = await verifyEmailToken(req.body.token);
  res.json({ success: true, email, message: 'Email verified. You can now log in.' });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  await resendVerification(req.body.email);
  res.json({ success: true, message: 'If an unverified account exists for that email, a new link has been sent.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset(req.body.email);
  res.json({ success: true, message: 'If an account with that email supports password sign-in, a reset link has been sent.' });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword(req.body.token, req.body.password);
  res.json({ success: true, message: 'Password updated. You can now log in.' });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: serializeUser(req.user),
    socketToken: signToken(req.user._id),
  });
});
