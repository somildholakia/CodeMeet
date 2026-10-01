import Meeting from '../models/Meeting.js';

const roomCodeCache = new Map();
const roomLanguageCache = new Map();

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const user = socket.user;

    socket.on('join-room', async ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string' || roomId.length > 64) return;

      const existingRoom = socket.data.roomId;
      if (existingRoom && existingRoom !== roomId) {
        await leaveCurrentRoom(socket);
      }

      const meeting = await Meeting.findOne({ roomId }).select('roomId language code status');
      if (!meeting || meeting.status === 'ended') {
        socket.emit('room-error', { message: 'Meeting is not available.' });
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.user = user;

      if (!roomCodeCache.has(roomId)) {
        roomCodeCache.set(roomId, meeting.code || '');
        roomLanguageCache.set(roomId, meeting.language || 'javascript');
      }

      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user,
      });

      const room = io.sockets.adapter.rooms.get(roomId);
      const otherSocketIds = room ? [...room].filter((id) => id !== socket.id) : [];

      socket.emit('room-participants', otherSocketIds);
      socket.emit('code-change', {
        code: roomCodeCache.get(roomId) || '',
        language: roomLanguageCache.get(roomId) || 'javascript',
      });
    });

    socket.on('leave-room', () => {
      void leaveCurrentRoom(socket);
    });

    socket.on('disconnect', () => {
      void leaveCurrentRoom(socket);
    });

    socket.on('code-change', ({ roomId, code, language }) => {
      if (socket.data.roomId !== roomId || typeof code !== 'string') return;

      roomCodeCache.set(roomId, code);
      if (language) roomLanguageCache.set(roomId, language);

      socket.to(roomId).emit('code-change', {
        code,
        language: roomLanguageCache.get(roomId),
      });
    });

    socket.on('code-sync-request', ({ roomId }) => {
      if (socket.data.roomId !== roomId) return;

      const code = roomCodeCache.get(roomId);
      if (code !== undefined) {
        socket.emit('code-change', {
          code,
          language: roomLanguageCache.get(roomId) || 'javascript',
        });
      }
    });

    socket.on('cursor-change', ({ roomId, position }) => {
      if (socket.data.roomId !== roomId || !position) return;
      socket.to(roomId).emit('cursor-change', {
        socketId: socket.id,
        position,
        user,
      });
    });

    socket.on('send-message', ({ roomId, message }) => {
      if (socket.data.roomId !== roomId || !message?.text) return;

      const text = String(message.text).trim().slice(0, 2000);
      if (!text) return;

      socket.to(roomId).emit('receive-message', {
        senderId: user.id,
        senderName: user.name,
        text,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('typing', {
        user: { id: user.id, name: user.name },
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('webrtc-offer', ({ to, offer }) => {
      if (typeof to !== 'string' || !offer) return;
      io.to(to).emit('webrtc-offer', {
        from: socket.id,
        offer,
      });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      if (typeof to !== 'string' || !answer) return;
      io.to(to).emit('webrtc-answer', {
        from: socket.id,
        answer,
      });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      if (typeof to !== 'string' || !candidate) return;
      io.to(to).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate,
      });
    });

    socket.on('mic-toggle', ({ roomId, isMuted }) => {
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('mic-toggle', {
        socketId: socket.id,
        isMuted: Boolean(isMuted),
      });
    });

    socket.on('camera-toggle', ({ roomId, isCameraOff }) => {
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('camera-toggle', {
        socketId: socket.id,
        isCameraOff: Boolean(isCameraOff),
      });
    });

    socket.on('screen-share', ({ roomId, isSharing }) => {
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('screen-share', {
        socketId: socket.id,
        isSharing: Boolean(isSharing),
      });
    });
  });

  async function leaveCurrentRoom(socket) {
    const roomId = socket.data.roomId;
    const user = socket.data.user;
    if (!roomId) return;

    socket.to(roomId).emit('user-left', {
      socketId: socket.id,
      user,
    });

    socket.leave(roomId);
    socket.data.roomId = null;

    const code = roomCodeCache.get(roomId);
    const language = roomLanguageCache.get(roomId);

    if (code !== undefined) {
      await Meeting.findOneAndUpdate(
        { roomId },
        { code, ...(language ? { language } : {}) }
      ).catch(() => {});
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      roomCodeCache.delete(roomId);
      roomLanguageCache.delete(roomId);
    }
  }
}
