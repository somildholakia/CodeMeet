import { io } from 'socket.io-client';

let socket;

export function getSocket(token) {
  const auth = token ? { token } : {};

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  } else {
    // Socket.IO sends this auth payload on the next connection attempt.
    socket.auth = auth;
  }

  return socket;
}
