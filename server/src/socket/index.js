import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';

const roomCodeCache = new Map();
const roomLanguageCache = new Map();
const roomPersistTimers = new Map();
const MAX_CODE_LENGTH = 20000;
const ALLOWED_LANGUAGES = new Set(['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust']);

function allowSocketEvent(socket, key, limit, windowMs) {
  const now = Date.now();
  const bucket = socket.data.rateLimits?.get(key);

  if (!socket.data.rateLimits) socket.data.rateLimits = new Map();

  if (!bucket || now - bucket.startedAt >= windowMs) {
    socket.data.rateLimits.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function scheduleCodePersist(roomId) {
  clearTimeout(roomPersistTimers.get(roomId));
  roomPersistTimers.set(
    roomId,
    setTimeout(() => {
      roomPersistTimers.delete(roomId);
      void persistRoomCode(roomId);
    }, 1000)
  );
}

async function persistRoomCode(roomId) {
  const code = roomCodeCache.get(roomId);
  if (code === undefined) return;

  const language = roomLanguageCache.get(roomId);
  await Meeting.findOneAndUpdate(
    { roomId, status: 'active' },
    { code, ...(language ? { language } : {}) }
  ).catch((error) => {
    console.error('Failed to persist collaborative code:', error);
  });
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const user = socket.user;
    socket.data.rateLimits = new Map();

    socket.on('join-room', async ({ roomId }) => {
      if (!allowSocketEvent(socket, 'join-room', 10, 60_000)) return;
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
      const otherParticipants = otherSocketIds.map((id) => ({
        socketId: id,
        user: io.sockets.sockets.get(id)?.data?.user || null,
      }));

      socket.emit('room-participants', otherParticipants);
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
      if (!allowSocketEvent(socket, 'code-change', 120, 10_000)) return;
      if (socket.data.roomId !== roomId || typeof code !== 'string') return;
      if (code.length > MAX_CODE_LENGTH) return;
      if (language && !ALLOWED_LANGUAGES.has(language)) return;

      roomCodeCache.set(roomId, code);
      if (language) roomLanguageCache.set(roomId, language);
      scheduleCodePersist(roomId);

      socket.to(roomId).emit('code-change', {
        code,
        language: roomLanguageCache.get(roomId),
      });
    });

    socket.on('code-sync-request', ({ roomId }) => {
      if (!allowSocketEvent(socket, 'code-sync-request', 20, 10_000)) return;
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
      if (!allowSocketEvent(socket, 'cursor-change', 60, 2_000)) return;
      if (socket.data.roomId !== roomId || !position) return;
      socket.to(roomId).emit('cursor-change', {
        socketId: socket.id,
        position,
        user,
      });
    });

    socket.on('send-message', async ({ roomId, message }) => {
      if (!allowSocketEvent(socket, 'send-message', 20, 10_000)) return;
      if (socket.data.roomId !== roomId || !message?.text) return;

      const text = String(message.text).trim().slice(0, 2000);
      if (!text) return;

      try {
        const meeting = await Meeting.findOne({ roomId }).select('_id status');
        if (!meeting || meeting.status === 'ended') return;

        const createdAt = new Date();
        const savedMessage = await Message.create({
          meeting: meeting._id,
          sender: user.id,
          senderName: user.name,
          text,
          createdAt,
          updatedAt: createdAt,
        });

        socket.to(roomId).emit('receive-message', {
          id: savedMessage._id.toString(),
          senderId: user.id,
          senderName: user.name,
          text,
          createdAt: createdAt.toISOString(),
        });
      } catch (error) {
        console.error('Failed to persist socket message:', error);
        socket.emit('socket-error', { message: 'Message could not be sent.' });
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      if (!allowSocketEvent(socket, 'typing', 20, 5_000)) return;
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('typing', {
        user: { id: user.id, name: user.name },
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('webrtc-offer', ({ to, offer }) => {
      if (!allowSocketEvent(socket, 'webrtc-offer', 80, 10_000)) return;
      if (typeof to !== 'string' || !offer || !socket.data.roomId) return;
      const target = io.sockets.sockets.get(to);
      if (!target || target.data.roomId !== socket.data.roomId) return;
      io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      if (!allowSocketEvent(socket, 'webrtc-answer', 80, 10_000)) return;
      if (typeof to !== 'string' || !answer || !socket.data.roomId) return;
      const target = io.sockets.sockets.get(to);
      if (!target || target.data.roomId !== socket.data.roomId) return;
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      if (!allowSocketEvent(socket, 'webrtc-ice-candidate', 150, 10_000)) return;
      if (typeof to !== 'string' || !candidate || !socket.data.roomId) return;
      const target = io.sockets.sockets.get(to);
      if (!target || target.data.roomId !== socket.data.roomId) return;
      io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
    });

    socket.on('mic-toggle', ({ roomId, isMuted }) => {
      if (!allowSocketEvent(socket, 'media-toggle', 30, 10_000)) return;
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('mic-toggle', {
        socketId: socket.id,
        isMuted: Boolean(isMuted),
      });
    });

    socket.on('camera-toggle', ({ roomId, isCameraOff }) => {
      if (!allowSocketEvent(socket, 'media-toggle', 30, 10_000)) return;
      if (socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('camera-toggle', {
        socketId: socket.id,
        isCameraOff: Boolean(isCameraOff),
      });
    });

    socket.on('screen-share', ({ roomId, isSharing }) => {
      if (!allowSocketEvent(socket, 'media-toggle', 30, 10_000)) return;
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

    clearTimeout(roomPersistTimers.get(roomId));
    roomPersistTimers.delete(roomId);
    await persistRoomCode(roomId);

    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      roomCodeCache.delete(roomId);
      roomLanguageCache.delete(roomId);
    }
  }
}
