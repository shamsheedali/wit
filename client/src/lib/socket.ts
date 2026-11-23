import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (isAdmin = false): Socket | null => {
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return isAdmin
      ? localStorage.getItem("adminToken") 
      : localStorage.getItem("userToken");
  };

  if (!getToken()) {
    return null;
  }

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      reconnection: true,
      transports: ["polling", "websocket"],
      withCredentials: true,
      auth: (cb) => {
        cb({ token: getToken() });
      },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket?.emit("join");
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.IO server:", reason);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error.message);
      if (error.message.includes("Authentication error")) {
        disconnectSocket();
      }
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
