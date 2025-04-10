import { Server, Socket } from 'socket.io';
import User from '../app/models/user.model';
import log from '../utils/logger';
import { v4 as uuidv4 } from 'uuid'; //for unique game IDs

export default function socketHandler(io: Server) {
  const onlineUsers = new Map<string, string>(); // userId -> socketId
  const matchmakingQueue = new Map<string, { userId: string; time: string; socket: Socket }>(); // userId -> queue entry

  io.on('connection', (socket: Socket) => {
    log.info(`User connected: ${socket.id}`);

    socket.on('join', async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      log.info(`${userId} joined their room`);

      const user = await User.findById(userId).populate('friends', 'username');
      if (user && user.friends) {
        user.friends.forEach((friend) => {
          io.to(friend._id.toString()).emit('friendStatus', {
            userId,
            online: true,
          });
        });
      }
      io.emit('onlineUsersUpdate', Array.from(onlineUsers.keys()));
    });

    socket.on('joinMatchmaking', (data: { userId: string; time: string }) => {
      const { userId, time } = data;
      log.info(`${userId} joined matchmaking with time ${time}`);

      // Added to queue
      matchmakingQueue.set(userId, { userId, time, socket });

      // Looking for a match
      for (const [queuedUserId, queuedData] of matchmakingQueue) {
        if (queuedUserId !== userId && queuedData.time === time) {
          // Match found
          const gameId = uuidv4();
          log.info(`Matched ${userId} with ${queuedUserId}, gameId: ${gameId}`);

          // Notifying both players
          socket.emit('matchFound', { opponentId: queuedUserId, gameId, time });
          queuedData.socket.emit('matchFound', { opponentId: userId, gameId, time });

          // Removed from queue
          matchmakingQueue.delete(userId);
          matchmakingQueue.delete(queuedUserId);
          return;
        }
      }
      log.info(`${userId} waiting in queue...`);
    });

    socket.on('cancelMatchmaking', (userId: string) => {
      matchmakingQueue.delete(userId);
      log.info(`${userId} canceled matchmaking`);
    });

    socket.on('playRequest', (data: { senderId: string; receiverId: string; time: string }) => {
      const { senderId, receiverId, time } = data;
      log.info(`Play request from ${senderId} to ${receiverId} with time ${time}`);
      io.to(receiverId).emit('playRequestReceived', {
        senderId,
        receiverId,
        time,
        timestamp: Date.now(),
      });
    });

    socket.on(
      'acceptPlayRequest',
      (data: { senderId: string; receiverId: string; gameId: string; time: string }) => {
        const { senderId, receiverId, gameId, time } = data;
        log.info(`Play request accepted by ${receiverId} for ${senderId}, gameId: ${gameId}`);
        io.to(senderId).emit('playRequestAccepted', {
          opponentId: receiverId,
          gameId,
          time,
          timestamp: Date.now(),
        });
      }
    );

    socket.on('joinGame', (data: { gameId: string }) => {
      const { gameId } = data;
      socket.join(gameId);
      log.info(`User joined game room: ${gameId}`);
    });

    socket.on('makeMove', (data: { gameId: string; playerId: string; fen: string; move: any }) => {
      const { gameId, playerId, fen, move } = data;
      log.info(`Move made in game ${gameId} by player ${playerId}`);
      io.to(gameId).emit('moveMade', { gameId, playerId, fen, move });
    });

    socket.on('sendChatMessage', (data: { gameId: string; userId: string; message: string }) => {
      const { gameId, userId, message } = data;
      log.info(`Chat message in game ${gameId} from ${userId}: ${message}`);
      io.to(gameId).emit('chatMessageReceived', {
        senderId: userId,
        content: message,
        timestamp: Date.now(),
      });
    });

    socket.on('gameTerminated', (data) => {
      const { gameId, playerOne, playerTwo } = data;
      io.to(playerOne).to(playerTwo).emit('gameTerminated', { gameId });
      log.info(`Terminated game ${gameId} for ${playerOne} and ${playerTwo}`);
    });

    socket.on('userBanned', (data) => {
      const { userId } = data;
      io.to(userId).emit('userBanned', { userId });
    });

    socket.on('opponentBanned', (data) => {
      const { gameId, bannedUserId, opponentId } = data;
      io.to(opponentId).emit('opponentBanned', { gameId, bannedUserId });
    });

    socket.on('disconnect', async () => {
      log.info('User disconnected:', socket.id);
      const userId = [...onlineUsers.entries()].find(([, sId]) => sId === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        matchmakingQueue.delete(userId); // Clean up queue
        const user = await User.findById(userId).populate('friends', 'username');
        if (user && user.friends) {
          user.friends.forEach((friend) => {
            io.to(friend._id.toString()).emit('friendStatus', {
              userId,
              online: false,
            });
          });
        }
        io.emit('onlineUsersUpdate', Array.from(onlineUsers.keys()));
      }
    });
  });
}
