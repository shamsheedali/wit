import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import socketHandler from './sockets';
import logger from './utils/logger';
import connectDB from './config/database';
import { connectRedis } from './config/redis';

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

app.set('io', io);

// Initialize Socket.IO handlers
socketHandler(io);

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
