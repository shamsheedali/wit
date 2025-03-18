import { Server, Socket } from "socket.io";
import User from '../app/models/user.model';

export default function socketHandler(io: Server) {
  const onlineUsers = new Map<string, string>(); // userId -> socketId

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", async (userId: string) => {
      socket.join(userId);
      console.log(`${userId} joined their room`);

      // Update friends' status
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

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      const userId = [...onlineUsers.entries()].find(([, sId]) => sId === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        const user = await User.findById(userId).populate('friends', 'username');
        if (user && user.friends) {
          user.friends.forEach((friend: any) => {
            io.to(friend._id.toString()).emit('friendStatus', { userId, online: false });
          });
        }
      }
    });
  });
}
