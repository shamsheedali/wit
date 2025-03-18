import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io'
import app from './app';
import socketHandler from './sockets';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})

// Pass io to the app
app.set('io', io);

// Initialize Socket.IO handlers
socketHandler(io);

httpServer.listen(PORT, () => {
    console.log(`Server running on port:${PORT}`);
})
