import { Server, Socket } from 'socket.io';
import User from '../app/models/user.model';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import container from '../config/inversify.config';
import ClubRepository from '../app/repositories/club.repository';
import TYPES from '../config/types';
import { Types } from 'mongoose';
import TokenService from '../app/services/token.service';
import Role from '../constants/role';

interface SocketUser {
  userId: string;
  email: string;
  role: string;
}

export default function socketHandler(io: Server) {
  const onlineUsers = new Map<string, string>(); // userId -> socketId
  const matchmakingQueue = new Map<string, { userId: string; time: string; socket: Socket }>();
  const gameResults = new Map<string, { result: string; lossType: string }>(); // gameId -> result
  const clubRepository = container.get<ClubRepository>(TYPES.ClubRepository);
  const tokenService = container.get<TokenService>(TYPES.TokenService);

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = tokenService.verifyToken(token, process.env.JWT_SECRET!) as SocketUser;

      socket.data.user = decoded;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed', { socketId: socket.id, error });
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authUser = socket.data.user as SocketUser;
    const authUserId = authUser.userId;
    const isAdmin = authUser.role === Role.ADMIN;

    logger.info(`User connected: ${socket.id} (${authUserId})`);

    socket.on('join', async () => {
      try {
        onlineUsers.set(authUserId, socket.id);
        socket.join(authUserId);

        if (isAdmin) {
          socket.join('adminRoom');
        }

        const user = await User.findById(authUserId).populate('friends', 'username');
        if (user?.friends) {
          user.friends.forEach((friend) => {
            io.to(friend._id.toString()).emit('friendStatus', {
              userId: authUserId,
              online: true,
            });
          });
        }
        io.emit('onlineUsersUpdate', Array.from(onlineUsers.keys()));
      } catch (error) {
        logger.error('Error in socket join handler', error);
      }
    });

    socket.on('joinMatchmaking', (data: { time: string }) => {
      const { time } = data;
      matchmakingQueue.set(authUserId, { userId: authUserId, time, socket });

      for (const [queuedUserId, queuedData] of matchmakingQueue) {
        if (queuedUserId !== authUserId && queuedData.time === time) {
          const gameId = uuidv4();
          socket.emit('matchFound', {
            opponentId: queuedUserId,
            gameId,
            time,
            playerColor: 'w',
          });
          queuedData.socket.emit('matchFound', {
            opponentId: authUserId,
            gameId,
            time,
            playerColor: 'b',
          });
          matchmakingQueue.delete(authUserId);
          matchmakingQueue.delete(queuedUserId);
          return;
        }
      }
    });

    socket.on('cancelMatchmaking', () => {
      matchmakingQueue.delete(authUserId);
    });

    socket.on(
      'playRequest',
      (data: {
        receiverId: string;
        senderName: string;
        senderPfp: string;
        senderEloRating: number;
        time: string;
      }) => {
        const { receiverId, senderName, senderPfp, senderEloRating, time } = data;
        io.to(receiverId).emit('playRequestReceived', {
          senderId: authUserId,
          receiverId,
          senderName,
          senderPfp,
          senderEloRating,
          time,
          timestamp: Date.now(),
        });
      }
    );

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

    socket.on('friendRequestAccepted', (data: { senderName: string; receiverId: string }) => {
      const { senderName, receiverId } = data;
      io.to(receiverId).emit('notification', {
        type: 'message',
        senderId: authUserId,
        senderName,
        content: `${senderName} accepted your friend request`,
        timestamp: Date.now(),
      });
    });

    socket.on(
      'tournamentPlayRequest',
      (data: {
        receiverId: string;
        senderName: string;
        senderPfp: string;
        senderEloRating: number;
        time: string;
        tournamentId: string;
        matchId: string;
      }) => {
        io.to(data.receiverId).emit('tournamentPlayRequestReceived', {
          ...data,
          senderId: authUserId,
          timestamp: Date.now(),
        });
      }
    );

    socket.on(
      'tournamentPlayRequestAccepted',
      (data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        senderPfp: string;
        senderEloRating: number;
        gameId: string;
        dbGameId: string;
        time: string;
        tournamentId: string;
        matchId: string;
      }) => {
        io.to(data.receiverId).emit('tournamentPlayRequestAccepted', {
          ...data,
          opponentId: data.receiverId,
          opponentName: data.senderName,
          timestamp: Date.now(),
        });
        io.to(data.receiverId).emit('tournamentGameStarted', {
          gameId: data.gameId,
          dbGameId: data.dbGameId,
          opponentId: data.senderId,
          opponentName: data.senderName,
          time: data.time,
          tournamentId: data.tournamentId,
          matchId: data.matchId,
          timestamp: Date.now(),
        });
      }
    );

    socket.on('tournamentStarted', (data) => {
      data.players.forEach((playerId: string) => {
        io.to(playerId).emit('tournamentStarted', data);
      });
    });

    socket.on('joinGame', (data: { gameId: string }) => {
      const { gameId } = data;
      socket.join(gameId);
    });

    socket.on('makeMove', (data: { gameId: string; fen: string; move: any }) => {
      const { gameId, fen, move } = data;
      io.to(gameId).emit('moveMade', { gameId, playerId: authUserId, fen, move });
    });

    socket.on('sendChatMessage', (data: { gameId: string; message: string }) => {
      const { gameId, message } = data;
      io.to(gameId).emit('chatMessageReceived', {
        senderId: authUserId,
        content: message,
        timestamp: Date.now(),
      });
    });

    socket.on(
      'sendMessage',
      async (data: {
        senderName: string;
        receiverId: string;
        content: string;
        _id: string;
        timestamp: string;
      }) => {
        const { senderName, receiverId, content, _id, timestamp } = data;
        io.to(receiverId).emit('messageReceived', {
          senderId: authUserId,
          senderName,
          receiverId,
          content,
          timestamp,
          _id,
        });

        io.to(receiverId).emit('notification', {
          type: 'message',
          senderId: authUserId,
          senderName,
          content: `New message from ${senderName}`,
          timestamp: Date.now(),
        });
      }
    );

    socket.on(
      'gameReport',
      async (data: {
        gameId: string;
        reportedUserId: string;
        reason: string;
        details: string;
        _id: string;
        timestamp: string;
      }) => {
        const { gameId, reportedUserId, reason, details, _id, timestamp } = data;
        io.to('adminRoom').emit('gameReportReceived', {
          _id,
          gameId,
          reportingUserId: authUserId,
          reportedUserId,
          reason,
          details,
          timestamp,
        });
      }
    );

    socket.on('gameTerminated', (data) => {
      if (!isAdmin) return;
      const { gameId, playerOne, playerTwo } = data;
      io.to(playerOne).to(playerTwo).emit('gameTerminated', { gameId });
      gameResults.delete(gameId);
    });

    socket.on('userBanned', (data) => {
      if (!isAdmin) return;
      io.to(data.userId).emit('userBanned', { userId: data.userId });
    });

    socket.on('opponentBanned', (data) => {
      if (!isAdmin) return;
      const { gameId, bannedUserId, opponentId } = data;
      io.to(opponentId).emit('opponentBanned', { gameId, bannedUserId });
      gameResults.delete(gameId);
    });

    socket.on(
      'opponentResigned',
      (data: { gameId: string; opponentId: string; result: string; lossType: string }) => {
        const { gameId, opponentId, result, lossType } = data;
        if (!gameResults.has(gameId)) {
          gameResults.set(gameId, { result, lossType });
          io.to(opponentId).emit('opponentResigned', { gameId, opponentId, result, lossType });
        }
      }
    );

    socket.on('opponentDrawRequest', (data: { opponentId: string; senderName: string }) => {
      const { opponentId, senderName } = data;
      io.to(opponentId).emit('opponentDrawRequestReceived', {
        opponentId,
        senderId: authUserId,
        senderName,
      });
    });

    socket.on('drawRequestAccepted', (data) => {
      const { playerOne, playerTwo } = data;
      io.to(playerOne).emit('drawRequestAccepted');
      io.to(playerTwo).emit('drawRequestAccepted');
    });

    socket.on('tournamentUpdate', (updatedTournament: any) => {
      io.emit('tournamentUpdated', updatedTournament);
    });

    socket.on('joinClubChat', async (data: { clubName: string }) => {
      try {
        const { clubName } = data;
        const club = await clubRepository.findByName(clubName);
        if (!club) {
          socket.emit('clubChatError', { message: 'Club not found' });
          return;
        }
        const userObjectId = new Types.ObjectId(authUserId);
        if (!club.members?.some((memberId) => memberId.equals(userObjectId))) {
          socket.emit('clubChatError', { message: 'You are not a member of this club' });
          return;
        }
        socket.join(clubName);
      } catch (error) {
        logger.error('Error in joinClubChat handler', error);
      }
    });

    socket.on('sendClubMessage', (data: { clubName: string; message: string }) => {
      const { clubName, message } = data;
      io.to(clubName).emit('clubMessageReceived', {
        senderId: authUserId,
        content: message,
        timestamp: Date.now(),
      });
    });

    socket.on('clubDeleted', (data: { clubName: string }) => {
      if (!isAdmin) return;
      const { clubName } = data;
      io.to(clubName).emit('clubDeleted');
    });

    socket.on('disconnect', async () => {
      try {
        if (onlineUsers.get(authUserId) === socket.id) {
          onlineUsers.delete(authUserId);
          matchmakingQueue.delete(authUserId);
          const user = await User.findById(authUserId).populate('friends', 'username');
          if (user?.friends) {
            user.friends.forEach((friend) => {
              io.to(friend._id.toString()).emit('friendStatus', {
                userId: authUserId,
                online: false,
              });
            });
          }
          io.emit('onlineUsersUpdate', Array.from(onlineUsers.keys()));
        }
      } catch (error) {
        logger.error('Error in socket disconnect handler', error);
      }
    });
  });
}
