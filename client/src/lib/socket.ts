import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(process.env.BACKEND_URL || 'http://localhost:5000', {
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socket?.emit('join', userId); // Join the user’s room
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};