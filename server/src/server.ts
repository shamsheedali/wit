import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import socketHandler from './sockets';
import log from './utils/logger';

const PORT = Number(process.env.PORT) || 8080;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },

  //Socket.IO optimizations:
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  maxHttpBufferSize: 1e8, // 100MB max payload
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
  },
});

// Pass io to the app
app.set('io', io);

// Initialize Socket.IO handlers
socketHandler(io);

httpServer.listen(PORT, '0.0.0.0', () => {
  log.info(`Server running on port:${PORT}`);
});
