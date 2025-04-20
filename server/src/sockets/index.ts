import { Server, Socket } from 'socket.io';
import Admin from '../app/models/admin.model';
import User from '../app/models/user.model';
import log from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import container from '../config/inversify.config';
import ClubRepository from '../app/repositories/club.repository';
import TYPES from '../config/types';
import { Types } from 'mongoose';

export default function socketHandler(io: Server) {
  const onlineUsers = new Map<string, string>(); // userId -> socketId
  const matchmakingQueue = new Map<string, { userId: string; time: string; socket: Socket }>();
  const clubRepository = container.get<ClubRepository>(TYPES.ClubRepository);

  io.on('connection', (socket: Socket) => {
    log.info(`User connected: ${socket.id}`);

    socket.on('join', async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      // log.info(`${userId} joined their room`);

      const admin = await Admin.findOne({ userId });
      if (admin) {
        socket.join('adminRoom');
        // log.info(`${userId} joined admin room`);
      }

      const friends = await User.findById(userId).populate('friends', 'username');
      if (friends && friends.friends) {
        friends.friends.forEach((friend) => {
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
      // log.info(`${userId} joined matchmaking with time ${time}`);
      matchmakingQueue.set(userId, { userId, time, socket });

      for (const [queuedUserId, queuedData] of matchmakingQueue) {
        if (queuedUserId !== userId && queuedData.time === time) {
          const gameId = uuidv4();
          // log.info(`Matched ${userId} with ${queuedUserId}, gameId: ${gameId}`);
          socket.emit('matchFound', { opponentId: queuedUserId, gameId, time });
          queuedData.socket.emit('matchFound', { opponentId: userId, gameId, time });
          matchmakingQueue.delete(userId);
          matchmakingQueue.delete(queuedUserId);
          return;
        }
      }
      log.info(`${userId} waiting in queue...`);
    });

    socket.on('cancelMatchmaking', (userId: string) => {
      matchmakingQueue.delete(userId);
      // log.info(`${userId} canceled matchmaking`);
    });

    // Friend game play request
    socket.on(
      'playRequest',
      (data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        senderPfp: string;
        time: string;
      }) => {
        const { senderId, receiverId, senderName, senderPfp, time } = data;
        // log.info(`Friend play request from ${senderId} to ${receiverId}`);
        io.to(receiverId).emit('playRequestReceived', {
          senderId,
          receiverId,
          senderName,
          senderPfp,
          time,
          timestamp: Date.now(),
        });
      }
    );

    // Friend game accept play request
    socket.on(
      'acceptPlayRequest',
      (data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        gameId: string;
        dbGameId: string;
        time: string;
      }) => {
        const { senderId, receiverId, senderName, gameId, dbGameId, time } = data;
        // log.info(`Friend play request accepted by ${receiverId} for game ${gameId}`);
        io.to(senderId).emit('playRequestAccepted', {
          senderId,
          receiverId,
          opponentId: receiverId,
          opponentName: senderName,
          gameId,
          dbGameId,
          time,
          timestamp: Date.now(),
        });
        io.to(receiverId).emit('gameStarted', {
          gameId,
          dbGameId,
          opponentId: senderId,
          opponentName: senderName,
          time,
        });
      }
    );

    // Tournament play request
    socket.on(
      'tournamentPlayRequest',
      (data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        senderPfp: string;
        time: string;
        tournamentId: string;
        matchId: string;
      }) => {
        const { senderId, receiverId, senderName, senderPfp, time, tournamentId, matchId } = data;
        // log.info(
        //   `Tournament play request from ${senderId} to ${receiverId} for tournament ${tournamentId}`
        // );
        io.to(receiverId).emit('tournamentPlayRequestReceived', {
          senderId,
          receiverId,
          senderName,
          senderPfp,
          time,
          tournamentId,
          matchId,
          timestamp: Date.now(),
        });
      }
    );

    // Tournament accept play request
    socket.on(
      'tournamentPlayRequestAccepted',
      (data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        gameId: string;
        dbGameId: string;
        time: string;
        tournamentId: string;
        matchId: string;
      }) => {
        const { senderId, receiverId, senderName, gameId, dbGameId, time, tournamentId, matchId } =
          data;
        // log.info(`Tournament play request accepted by ${receiverId} for game ${gameId}`);
        io.to(senderId).emit('tournamentPlayRequestAccepted', {
          senderId,
          receiverId,
          opponentId: receiverId,
          opponentName: senderName,
          gameId,
          dbGameId,
          time,
          tournamentId,
          matchId,
          timestamp: Date.now(),
        });
        io.to(receiverId).emit('tournamentGameStarted', {
          gameId,
          dbGameId,
          opponentId: senderId,
          opponentName: senderName,
          time,
          tournamentId,
          matchId,
          timestamp: Date.now(),
        });
      }
    );

    socket.on('joinGame', (data: { gameId: string }) => {
      const { gameId } = data;
      socket.join(gameId);
      // log.info(`User joined game room: ${gameId}`);
    });

    socket.on('makeMove', (data: { gameId: string; playerId: string; fen: string; move: any }) => {
      const { gameId, playerId, fen, move } = data;
      // log.info(`Move made in game ${gameId} by player ${playerId}`);
      io.to(gameId).emit('moveMade', { gameId, playerId, fen, move });
    });

    socket.on('sendChatMessage', (data: { gameId: string; userId: string; message: string }) => {
      const { gameId, userId, message } = data;
      // log.info(`Chat message in game ${gameId} from ${userId}: ${message}`);
      io.to(gameId).emit('chatMessageReceived', {
        senderId: userId,
        content: message,
        timestamp: Date.now(),
      });
    });

    socket.on(
      'sendMessage',
      async (data: {
        senderId: string;
        receiverId: string;
        content: string;
        _id: string;
        timestamp: string;
      }) => {
        const { senderId, receiverId, content, _id, timestamp } = data;
        // log.info(`Message from ${senderId} to ${receiverId}: ${content}`);

        io.to(receiverId).emit('messageReceived', {
          senderId,
          receiverId,
          content,
          timestamp,
          _id,
        });

        io.to(receiverId).emit('notification', {
          type: 'message',
          senderId,
          content: `New message from ${senderId}`,
          timestamp: Date.now(),
        });
      }
    );

    socket.on(
      'gameReport',
      async (data: {
        gameId: string;
        reportingUserId: string;
        reportedUserId: string;
        reason: string;
        details: string;
        _id: string;
        timestamp: string;
      }) => {
        const { gameId, reportingUserId, reportedUserId, reason, details, _id, timestamp } = data;
        // log.info(
        //   `Game report from ${reportingUserId} against ${reportedUserId} for game ${gameId}`
        // );

        io.to('adminRoom').emit('gameReportReceived', {
          _id,
          gameId,
          reportingUserId,
          reportedUserId,
          reason,
          details,
          timestamp,
        });
      }
    );

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

    socket.on('opponentResigned', (data) => {
      const { opponentId, result } = data;
      io.to(opponentId).emit('opponentResigned', { opponentId, result });
    });

    socket.on('tournamentUpdate', (updatedTournament: any) => {
      io.emit('tournamentUpdated', updatedTournament);
      // log.info(`Tournament updated: ${updatedTournament._id}`);
    });

    socket.on('joinClubChat', async (data: { clubName: string; userId: string }) => {
      const { clubName, userId } = data;
      const club = await clubRepository.findByName(clubName);
      if (!club) {
        socket.emit('clubChatError', { message: 'Club not found' });
        return;
      }
      const userObjectId = new Types.ObjectId(userId);
      if (!club.members?.some((memberId) => memberId.equals(userObjectId))) {
        socket.emit('clubChatError', { message: 'You are not a member of this club' });
        return;
      }
      socket.join(clubName);
      // log.info(`${userId} joined club chat: ${clubName}`);
    });

    socket.on('sendClubMessage', (data: { clubName: string; userId: string; message: string }) => {
      const { clubName, userId, message } = data;
      // log.info(`Club message in ${clubName} from ${userId}: ${message}`);
      io.to(clubName).emit('clubMessageReceived', {
        senderId: userId,
        content: message,
        timestamp: Date.now(),
      });
    });

    socket.on('clubDeleted', (data: { clubName: string }) => {
      const { clubName } = data;
      log.info(`Club deleted: ${clubName}`);
      io.to(clubName).emit('clubDeleted');
    });

    socket.on('disconnect', async () => {
      log.info('User disconnected:', socket.id);
      const userId = [...onlineUsers.entries()].find(([, sId]) => sId === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        matchmakingQueue.delete(userId);
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
