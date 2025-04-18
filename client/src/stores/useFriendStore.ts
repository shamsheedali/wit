import { create } from "zustand";
import { Socket } from "socket.io-client";
import { getSocket, initSocket } from "@/lib/socket";
import { fetchFriendRequests, fetchFriends, sendFriendRequest, updateFriendRequest } from "@/lib/api/friend";
import { FriendRequest, Friend } from "@/types/friend";
import { useAuthStore } from "@/stores";

interface FriendState {
  friendRequests: FriendRequest[];
  friends: Friend[];
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<{receiverId: string}>;
  updateFriendRequest: (requestId: string, status: "accepted" | "ignored") => Promise<void>;
  fetchFriends: () => Promise<void>;
  sendPlayRequest: (receiverId: string, senderName: string, senderPfp: string, time?: string) => void;
  initializeSocket: () => Socket | null;
}

export const useFriendStore = create<FriendState>((set) => ({
  friendRequests: [],
  friends: [],

  fetchFriends: async () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error("No authenticated user");
      return;
    }
    const result = await fetchFriends(userId);
    if (result.success) {
      console.log("Fetched friends:", result.data);
      set({ friends: result.data.map((f: Friend) => ({ ...f, online: false })) });
    } else {
      console.error("Failed to fetch friends:", result.error || result.message);
    }
  },

  fetchFriendRequests: async () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error("No authenticated user");
      return;
    }
    const result = await fetchFriendRequests(userId);
    if (result.success) {
      console.log("Fetched requests:", result.data);
      set({ friendRequests: result.data });
    } else {
      console.error("Failed to fetch friend requests:", result.error || result.message);
    }
  },

  sendFriendRequest: async (receiverId: string) => {
    const senderId = useAuthStore.getState().user?._id;
    if (!senderId) {
      console.error("No authenticated user");
      throw new Error("No authenticated user");
    }
    const result = await sendFriendRequest(senderId, receiverId);
    if (result.success) {
      set((state) => ({
        friendRequests: [...state.friendRequests, result.data],
      }));
      return result?.data?.receiverId;
    } else {
      console.error("Failed to send friend request:", result.error || result.message);
      throw new Error(result.message || "Failed to send friend request");
    }
  },

  updateFriendRequest: async (requestId: string, status: "accepted" | "ignored") => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error("No authenticated user");
      return;
    }
    const result = await updateFriendRequest(requestId, userId, status);
    if (result.success) {
      set((state) => {
        const updatedRequests = state.friendRequests.map((req) =>
          req._id === requestId ? result.data : req
        );
        if (status === "accepted") {
          const newFriend = state.friendRequests.find((req) => req._id === requestId)?.senderId;
          return {
            friendRequests: updatedRequests,
            friends: newFriend ? [...state.friends, newFriend] : state.friends,
          };
        }
        return { friendRequests: updatedRequests };
      });
    } else {
      console.error("Failed to update friend request:", result.error || result.message);
    }
  },

  sendPlayRequest: (receiverId: string, senderName: string, senderPfp: string, time = "10min") => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.log("No authenticated user for play request");
      return;
    }
    const socket = getSocket();
    if (!socket) {
      console.log("Socket not initialized");
      return;
    }
    socket.emit("playRequest", {
      senderId: userId,
      receiverId,
      senderName,
      senderPfp,
      time,
    });
    console.log(`Play request sent to ${receiverId}`);
  },

  initializeSocket: () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.log("No authenticated user for socket");
      return null;
    }
    const socket = getSocket() || initSocket(userId);
    socket.off("friendRequest").on("friendRequest", (request: FriendRequest) => {
      console.log("Received friendRequest:", request);
      set((state) => ({
        friendRequests: [...state.friendRequests, request],
      }));
      if (Notification.permission === "granted") {
        new Notification(`New friend request from ${request.senderId.username}`);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(`New friend request from ${request.senderId.username}`);
          }
        });
      }
    });

    socket.off("friendshipCreated").on("friendshipCreated", (data: { user: Friend }) => {
      set((state) => {
        const exists = state.friends.some((friend) => friend._id === data.user._id);
        if (exists) return state;
        return { friends: [...state.friends, { ...data.user, online: false }] };
      });
    });

    socket.off("friendStatus").on("friendStatus", (data: { userId: string; online: boolean }) => {
      console.log("Friend status update:", data);
      set((state) => ({
        friends: state.friends.map((friend) =>
          friend._id === data.userId ? { ...friend, online: data.online } : friend
        ),
      }));
    });

    socket.off("friendRequestUpdated").on("friendRequestUpdated", (data: { requestId: string; status: string }) => {
      set((state) => ({
        friendRequests: state.friendRequests.map((req) =>
          req._id === data.requestId ? { ...req, status: data.status as "accepted" | "ignored" } : req
        ),
      }));
    });

    return socket;
  },
}));