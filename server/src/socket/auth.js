import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import User from '../models/User.js';

/**
 * Runs before every socket connection is accepted. Reads the same
 * HTTP-only JWT cookie used by the REST API, verifies it, and attaches
 * the authenticated user to the socket. Connections without a valid
 * session are rejected outright — nobody can join a room by guessing
 * a roomId alone.
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) return next(new Error('Authentication required'));

    const { token } = cookie.parse(rawCookie);
    if (!token) return next(new Error('Authentication required'));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email avatar');
    if (!user) return next(new Error('Authentication required'));

    socket.user = { id: user._id.toString(), name: user.name, avatar: user.avatar };
    next();
  } catch {
    next(new Error('Authentication required'));
  }
}
