import Meeting from '../models/Meeting.js';

const roomCodeCache = new Map(); // roomId -> latest code (throttled writes to DB)

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // socket.user was set by socketAuthMiddleware from the verified JWT
    // cookie — never trust a user object sent from the client itself.
    const user = socket.user;

    socket.on('join-room', ({ roomId }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.user = user;

      socket.to(roomId).emit('user-joined', { socketId: socket.id, user });

      const room = io.sockets.adapter.rooms.get(roomId);
      const otherSocketIds = room ? [...room].filter((id) => id !== socket.id) : [];
      socket.emit('room-participants', otherSocketIds);
    });

    socket.on('leave-room', () => {
      leaveCurrentRoom(socket);
    });

    socket.on('disconnect', () => {
      leaveCurrentRoom(socket);
    });

    // --- Collaborative editor ---
    socket.on('code-change', ({ roomId, code, language }) => {
      roomCodeCache.set(roomId, code);
      socket.to(roomId).emit('code-change', { code, language });
    });

    socket.on('code-sync-request', ({ roomId }) => {
      const cached = roomCodeCache.get(roomId);
      if (cached !== undefined) socket.emit('code-change', { code: cached });
    });

    socket.on('cursor-change', ({ roomId, position }) => {
      socket.to(roomId).emit('cursor-change', { socketId: socket.id, position, user });
    });

    // --- Chat ---
    socket.on('send-message', ({ roomId, message }) => {
      const verifiedMessage = {
        ...message,
        senderId: user.id,
        senderName: user.name,
      };
      socket.to(roomId).emit('receive-message', verifiedMessage);
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('typing', { user, isTyping });
    });

    // --- WebRTC signalling ---
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
    });

    // --- Media state ---
    socket.on('mic-toggle', ({ roomId, isMuted }) => {
      socket.to(roomId).emit('mic-toggle', { socketId: socket.id, isMuted });
    });

    socket.on('camera-toggle', ({ roomId, isCameraOff }) => {
      socket.to(roomId).emit('camera-toggle', { socketId: socket.id, isCameraOff });
    });

    socket.on('screen-share', ({ roomId, isSharing }) => {
      socket.to(roomId).emit('screen-share', { socketId: socket.id, isSharing });
    });
  });

  async function leaveCurrentRoom(socket) {
    const { roomId, user } = socket.data;
    if (!roomId) return;

    socket.to(roomId).emit('user-left', { socketId: socket.id, user });
    socket.leave(roomId);

    const code = roomCodeCache.get(roomId);
    if (code !== undefined) {
      Meeting.findOneAndUpdate({ roomId }, { code }).catch(() => {});
    }

    socket.data.roomId = null;
  }
}
