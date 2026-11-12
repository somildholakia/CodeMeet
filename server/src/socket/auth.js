import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import User from '../models/User.js';

/**
 * Authenticate Socket.IO using the in-memory token returned by REST auth.
 * The HTTP-only cookie remains a compatibility fallback; session tokens are
 * never written to localStorage.
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    const cookieToken = cookie.parse(socket.handshake.headers.cookie || '').token;
    const token = socket.handshake.auth?.token || cookieToken;

    if (typeof token !== 'string' || !token) {
      return next(new Error('Authentication required'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email avatar emailVerified sessionVersion');
    if (!user || !user.emailVerified) return next(new Error('Authentication required'));
    if ((payload.sv ?? 0) !== (user.sessionVersion ?? 0)) {
      return next(new Error('Session expired. Please log in again.'));
    }

    socket.user = { id: user._id.toString(), name: user.name, avatar: user.avatar };
    next();
  } catch {
    next(new Error('Authentication required'));
  }
}
