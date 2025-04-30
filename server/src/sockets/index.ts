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
  const gameResults = new Map<string, { result: string; lossType: string }>(); // gameId -> result
  const clubRepository = container.get<ClubRepository>(TYPES.ClubRepository);

  io.on('connection', (socket: Socket) => {
    log.info(`User connected: ${socket.id}`);

    socket.on('join', async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);

      const admin = await Admin.findOne({ userId });
      if (admin) {
        socket.join('adminRoom');
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
      matchmakingQueue.set(userId, { userId, time, socket });

      for (const [queuedUserId, queuedData] of matchmakingQueue) {
        if (queuedUserId !== userId && queuedData.time === time) {
          const gameId = uuidv4();
          socket.emit('matchFound', {
            opponentId: queuedUserId,
            gameId,
            time,
            playerColor: 'w',
          });
          queuedData.socket.emit('matchFound', {
            opponentId: userId,
            gameId,
            time,
            playerColor: 'b',
          });
          matchmakingQueue.delete(userId);
          matchmakingQueue.delete(queuedUserId);
          return;
        }
      }
    });

    socket.on('cancelMatchmaking', (userId: string) => {
      matchmakingQueue.delete(userId);
    });

    socket.on(
      'playRequest',
      (data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        senderPfp: string;
        senderEloRating: number;
        time: string;
      }) => {
        const { senderId, receiverId, senderName, senderPfp, senderEloRating, time } = data;
        io.to(receiverId).emit('playRequestReceived', {
          senderId,
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

    socket.on(
      'friendRequestAccepted',
      (data: { senderId: string; senderName: string; receiverId: string }) => {
        const { senderId, senderName, receiverId } = data;
        io.to(receiverId).emit('notification', {
          type: 'message',
          senderId,
          senderName,
          content: `${senderName} accepted your friend request`,
          timestamp: Date.now(),
        });
      }
    );

    socket.on(
      'tournamentPlayRequest',
      (data: {
        senderId: string;
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

    socket.on('makeMove', (data: { gameId: string; playerId: string; fen: string; move: any }) => {
      const { gameId, playerId, fen, move } = data;
      io.to(gameId).emit('moveMade', { gameId, playerId, fen, move });
    });

    socket.on('sendChatMessage', (data: { gameId: string; userId: string; message: string }) => {
      const { gameId, userId, message } = data;
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
        senderName: string;
        receiverId: string;
        content: string;
        _id: string;
        timestamp: string;
      }) => {
        const { senderId, senderName, receiverId, content, _id, timestamp } = data;
        io.to(receiverId).emit('messageReceived', {
          senderId,
          senderName,
          receiverId,
          content,
          timestamp,
          _id,
        });

        io.to(receiverId).emit('notification', {
          type: 'message',
          senderId,
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
        reportingUserId: string;
        reportedUserId: string;
        reason: string;
        details: string;
        _id: string;
        timestamp: string;
      }) => {
        const { gameId, reportingUserId, reportedUserId, reason, details, _id, timestamp } = data;
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
      gameResults.delete(gameId);
    });

    socket.on('userBanned', (data) => {
      const { userId } = data;
      io.to(userId).emit('userBanned', { userId });
    });

    socket.on('opponentBanned', (data) => {
      const { gameId, bannedUserId, opponentId } = data;
      io.to(opponentId).emit('opponentBanned', { gameId, bannedUserId });
      gameResults.delete(gameId);
    });

    socket.on(
      'opponentResigned',
      (data: { gameId: string; opponentId: string; result: string; lossType: string }) => {
        const { gameId, opponentId, result, lossType } = data;
        // Prevent duplicate updates
        if (!gameResults.has(gameId)) {
          gameResults.set(gameId, { result, lossType });
          io.to(opponentId).emit('opponentResigned', { gameId, opponentId, result, lossType });
        }
      }
    );

    socket.on('opponentDrawRequest', (data) => {
      const { opponentId, senderId, senderName } = data;
      io.to(opponentId).emit('opponentDrawRequestReceived', { opponentId, senderId, senderName });
    });

    socket.on('drawRequestAccepted', (data) => {
      const { playerOne, playerTwo } = data;
      io.to(playerOne).emit('drawRequestAccepted');
      io.to(playerTwo).emit('drawRequestAccepted');
    });

    socket.on('tournamentUpdate', (updatedTournament: any) => {
      io.emit('tournamentUpdated', updatedTournament);
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
    });

    socket.on('sendClubMessage', (data: { clubName: string; userId: string; message: string }) => {
      const { clubName, userId, message } = data;
      io.to(clubName).emit('clubMessageReceived', {
        senderId: userId,
        content: message,
        timestamp: Date.now(),
      });
    });

    socket.on('clubDeleted', (data: { clubName: string }) => {
      const { clubName } = data;
      io.to(clubName).emit('clubDeleted');
    });

    socket.on('disconnect', async () => {
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
