// sockets/index.ts
import { Server, Socket } from "socket.io";
import User from "../app/models/user.model";

export default function socketHandler(io: Server) {
  const onlineUsers = new Map<string, string>();

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`${userId} joined their room`);

      const user = await User.findById(userId).populate("friends", "username");
      if (user && user.friends) {
        user.friends.forEach((friend: any) => {
          io.to(friend._id.toString()).emit("friendStatus", {
            userId,
            online: true,
          });
        });
      }
    });

    socket.on("playRequest", (data: { senderId: string; receiverId: string }) => {
      const { senderId, receiverId } = data;
      console.log(`Play request from ${senderId} to ${receiverId}`);
      io.to(receiverId).emit("playRequestReceived", {
        senderId,
        receiverId,
        timestamp: Date.now(),
      });
    });

    socket.on("acceptPlayRequest", (data: { senderId: string; receiverId: string; gameId: string }) => {
      const { senderId, receiverId, gameId } = data;
      console.log(`Play request accepted by ${receiverId} for ${senderId}, gameId: ${gameId}`);
      io.to(senderId).emit("playRequestAccepted", {
        opponentId: receiverId,
        gameId,
        timestamp: Date.now(),
      });
    });

    socket.on("joinGame", (data: { gameId: string }) => {
      const { gameId } = data;
      socket.join(gameId);
      console.log(`User joined game room: ${gameId}`);
    });

    socket.on("makeMove", (data: { gameId: string; playerId: string; fen: string }) => {
      const { gameId, playerId, fen } = data;
      console.log(`Move made in game ${gameId} by player ${playerId}`);
      io.to(gameId).emit("moveMade", { gameId, playerId, fen });
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
      const userId = [...onlineUsers.entries()].find(([, sId]) => sId === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        const user = await User.findById(userId).populate("friends", "username");
        if (user && user.friends) {
          user.friends.forEach((friend: any) => {
            io.to(friend._id.toString()).emit("friendStatus", {
              userId,
              online: false,
            });
          });
        }
      }
    });
  });
}