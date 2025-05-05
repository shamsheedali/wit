import { create } from "zustand";
import { Socket } from "socket.io-client";
import { getSocket, initSocket } from "@/lib/socket";
import {
  fetchFriendRequests,
  fetchFriends,
  sendFriendRequest,
  updateFriendRequest,
} from "@/lib/api/friend";
import { FriendRequest, Friend } from "@/types/friend";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";

interface FriendState {
  friendRequests: FriendRequest[];
  friends: Friend[];
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<{ receiverId: string }>;
  updateFriendRequest: (
    requestId: string,
    status: "accepted" | "ignored"
  ) => Promise<void>;
  fetchFriends: () => Promise<void>;
  sendPlayRequest: (
    receiverId: string,
    senderName: string,
    senderPfp: string,
    eloRating: number,
    time?: string
  ) => void;
  initializeSocket: () => Socket | null;
}

export const useFriendStore = create<FriendState>((set) => ({
  friendRequests: [],
  friends: [],

  fetchFriends: async () => {
    try {
      const userId = useAuthStore.getState().user?._id;
      if (!userId) {
        throw new Error("No authenticated user");
      }

      const result = await fetchFriends(userId);

      if (result.success) {
        const validFriends = result.data.filter(
          (friend: Friend) =>
            friend &&
            typeof friend === "object" &&
            friend._id &&
            typeof friend._id === "string"
        );

        set({ friends: validFriends });
      } else {
        throw new Error(result.message || "Failed to fetch friends");
      }
    } catch (error) {
      console.error("Error in fetchFriends:", error);
      set({ friends: [] });
      throw error;
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
      set({ friendRequests: result.data });
    } else {
      console.error(
        "Failed to fetch friend requests:",
        result.error || result.message
      );
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
      console.error(
        "Failed to send friend request:",
        result.error || result.message
      );
      throw new Error(result.message || "Failed to send friend request");
    }
  },

  updateFriendRequest: async (
    requestId: string,
    status: "accepted" | "ignored"
  ) => {
    try {
      const userId = useAuthStore.getState().user?._id;
      if (!userId) {
        throw new Error("No authenticated user");
      }

      const result = await updateFriendRequest(requestId, userId, status);

      if (result.success) {
        set((state) => {
          const updatedRequests = state.friendRequests.map((req) =>
            req._id === requestId ? result.data : req
          );

          return {
            friendRequests: updatedRequests,
          };
        });

        const store = useFriendStore.getState();

        await Promise.all([store.fetchFriendRequests(), store.fetchFriends()]);
      } else {
        throw new Error(result.message || "Failed to update friend request");
      }
    } catch (error) {
      console.error("Error in updateFriendRequest:", error);
      throw error;
    }
  },

  sendPlayRequest: (
    receiverId: string,
    senderName: string,
    senderPfp: string,
    senderEloRating: number,
    time = "10min"
  ) => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      toast.error("No authenticated user for play request");
      return;
    }
    const socket = getSocket();
    if (!socket) {
      toast.error("Socket not initialized");
      return;
    }
    socket.emit("playRequest", {
      senderId: userId,
      receiverId,
      senderName,
      senderPfp,
      senderEloRating,
      time,
    });
  },

  initializeSocket: () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      return null;
    }
    const socket = getSocket() || initSocket(userId);

    socket
      .off("friendRequest")
      .on("friendRequest", (request: FriendRequest) => {
        set((state) => ({
          friendRequests: [...state.friendRequests, request],
        }));
      });

    socket
      .off("friendshipCreated")
      .on("friendshipCreated", (data: { user: Friend }) => {
        set((state) => {
          const exists = state.friends.some(
            (friend) => friend._id === data.user?._id
          );
          if (exists) return state;
          return { friends: [...state.friends, data.user] };
        });
      });

    socket
      .off("friendRequestUpdated")
      .on(
        "friendRequestUpdated",
        (data: { requestId: string; status: string }) => {
          set((state) => ({
            friendRequests: state.friendRequests.map((req) =>
              req._id === data.requestId
                ? { ...req, status: data.status as "accepted" | "ignored" }
                : req
            ),
          }));
        }
      );

    return socket;
  },
}));
