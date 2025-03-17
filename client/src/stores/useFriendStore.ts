// src/lib/friendStore.ts
import { create } from 'zustand';
import { getSocket, initSocket } from '@/lib/socket';
import { fetchFriendRequests, fetchFriends, sendFriendRequest, updateFriendRequest } from '@/lib/api/friend';
import { FriendRequest, Friend } from '@/types/friend';
import { useAuthStore } from '@/stores'; // Adjust path if needed

interface FriendState {
  friendRequests: FriendRequest[];
  friends: Friend[];
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  updateFriendRequest: (requestId: string, status: 'accepted' | 'ignored') => Promise<void>;
  fetchFriends: () => Promise<void>;
  initializeSocket: () => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friendRequests: [],
  friends: [],

  fetchFriends: async () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error('No authenticated user');
      return;
    }
    const result = await fetchFriends(userId);
    if (result.success) {
      console.log('Fetched friends:', result.data);
      set({ friends: result.data });
    } else {
      console.error('Failed to fetch friends:', result.error || result.message);
    }
  },

  fetchFriendRequests: async () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error('No authenticated user');
      return;
    }
    const result = await fetchFriendRequests(userId);
    if (result.success) {
      console.log('Fetched requests:', result.data); // Add this
      set({ friendRequests: result.data });
    } else {
      console.error('Failed to fetch friend requests:', result.error || result.message);
    }
  },

  sendFriendRequest: async (receiverId: string) => {
    const senderId = useAuthStore.getState().user?._id;
    if (!senderId) {
      console.error('No authenticated user');
      throw new Error('No authenticated user'); // Throw to catch in UserProfile
    }
    const result = await sendFriendRequest(senderId, receiverId);
    if (result.success) {
      set((state) => ({
        friendRequests: [...state.friendRequests, result.data],
      }));
    } else {
      console.error('Failed to send friend request:', result.error || result.message);
      throw new Error(result.message || 'Failed to send friend request');
    }
  },

  updateFriendRequest: async (requestId: string, status: 'accepted' | 'ignored') => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error('No authenticated user');
      return;
    }
    const result = await updateFriendRequest(requestId, userId, status);
    if (result.success) {
      set((state) => {
        const updatedRequests = state.friendRequests.map((req) =>
          req._id === requestId ? result.data : req
        );
        if (status === 'accepted') {
          const newFriend = state.friendRequests.find((req) => req._id === requestId)?.senderId;
          return {
            friendRequests: updatedRequests,
            friends: newFriend ? [...state.friends, newFriend] : state.friends,
          };
        }
        return { friendRequests: updatedRequests };
      });
    } else {
      console.error('Failed to update friend request:', result.error || result.message);
    }
  },

  initializeSocket: () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.error('No authenticated user for socket');
      return;
    }
    const socket = getSocket() || initSocket(userId);
    socket.on('friendRequest', (request: FriendRequest) => {
      console.log('Received friendRequest:', request); // Add this
      set((state) => ({
        friendRequests: [...state.friendRequests, request],
      }));
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(`New friend request from ${request.senderId.username}`);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(`New friend request from ${request.senderId.username}`);
          }
        });
      }
    });
    socket.on('friendshipCreated', (data: { userId: string }) => {
      set((state) => ({
        friends: [...state.friends, { _id: data.userId, username: 'Unknown' }],
      }));
    });
    socket.on('friendRequestUpdated', (data: { requestId: string; status: string }) => {
      set((state) => ({
        friendRequests: state.friendRequests.map((req) =>
          req._id === data.requestId ? { ...req, status: data.status as 'accepted' | 'ignored' } : req
        ),
      }));
    });
  },
}));