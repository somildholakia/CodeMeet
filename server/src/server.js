import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { registerSocketHandlers } from './socket/index.js';
import { socketAuthMiddleware } from './socket/auth.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const allowedClientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedClientOrigins,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);
registerSocketHandlers(io);

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`CodeMeet API running on port ${PORT}`);
  });
}

start();
