import { createHash, randomBytes } from 'node:crypto';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './emailService.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const createToken = () => randomBytes(32).toString('hex');

async function issueVerificationEmail(user) {
  const token = createToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  await sendVerificationEmail(user, token);
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (!existing.emailVerified && existing.authMethods.includes('password')) {
      await issueVerificationEmail(existing);
      return { email: existing.email, verificationSent: true, alreadyRegistered: true };
    }
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name: String(name || '').trim(),
    email: normalizedEmail,
    password,
    authMethods: ['password'],
    emailVerified: false,
  });
  await issueVerificationEmail(user);
  return { email: user.email, verificationSent: true, alreadyRegistered: false };
}

export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.emailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in. Check your inbox or request a new verification link.');
  }
  return user;
}

export async function verifyEmailToken(token) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 256) {
    throw new ApiError(400, 'This verification link is invalid or has expired');
  }
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) throw new ApiError(400, 'This verification link is invalid or has expired');

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return user.email;
}

export async function resendVerification(email) {
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (user && !user.emailVerified && user.authMethods.includes('password')) {
    await issueVerificationEmail(user);
  }
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user || !user.password) return;

  const token = createToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  await sendPasswordResetEmail(user, token);
}

export async function resetPassword(token, password) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 256) {
    throw new ApiError(400, 'This password reset link is invalid or has expired');
  }
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) throw new ApiError(400, 'This password reset link is invalid or has expired');
  user.password = password;
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
}

export async function authenticateGoogle(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(503, 'Google sign-in is not configured on this server');
  }
  if (typeof credential !== 'string' || credential.length < 100 || credential.length > 10000) {
    throw new ApiError(400, 'Google sign-in credential is invalid');
  }

  let response;
  try {
    response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiError(503, 'Google sign-in is temporarily unavailable. Please try again.');
  }
  if (!response.ok) throw new ApiError(401, 'Google sign-in could not be verified');

  const payload = await response.json();
  const issuerValid = ['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss);
  const notExpired = Number(payload.exp) * 1000 > Date.now();
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID || !issuerValid || !notExpired || !emailVerified || !payload.email || !payload.sub) {
    throw new ApiError(401, 'Google sign-in could not be verified');
  }

  const email = String(payload.email).trim().toLowerCase();
  const [googleUser, emailUser] = await Promise.all([
    User.findOne({ googleId: payload.sub }).select('+googleId'),
    User.findOne({ email }).select('+googleId'),
  ]);

  if (googleUser && emailUser && googleUser._id.toString() !== emailUser._id.toString()) {
    throw new ApiError(409, 'This Google account and email belong to different CodeMeet accounts.');
  }

  let user = googleUser || emailUser;
  if (!user) {
    user = await User.create({
      name: payload.name || email.split('@')[0],
      email,
      googleId: payload.sub,
      avatar: payload.picture || '',
      authMethods: ['google'],
      emailVerified: true,
    });
  } else {
    if (user.googleId && user.googleId !== payload.sub) {
      throw new ApiError(409, 'This email is already linked to a different Google account');
    }
    user.googleId = payload.sub;
    user.email = email;
    user.emailVerified = true;
    user.authMethods = [...new Set([...(user.authMethods || []), 'google'])];
    if (!user.avatar && payload.picture) user.avatar = payload.picture;
    if (!user.name && payload.name) user.name = payload.name;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  return user;
}
