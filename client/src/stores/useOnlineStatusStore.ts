import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocket, initSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores';

interface OnlineStatusState {
  onlineUsers: string[]; // Array of user IDs
  initializeSocket: () => Socket | null;
  isUserOnline: (userId: string) => boolean;
}

export const useOnlineStatusStore = create<OnlineStatusState>((set, get) => ({
  onlineUsers: [],

  initializeSocket: () => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) {
      console.log("No authenticated user for socket");
      return null;
    }
    const socket = getSocket() || initSocket(userId);

    socket.off('onlineUsersUpdate').on('onlineUsersUpdate', (userIds: string[]) => {
      set({ onlineUsers: userIds });
      console.log('Online users updated:', userIds);
    });

    socket.off('friendStatus').on('friendStatus', (data: { userId: string; online: boolean }) => {
      set((state) => {
        const updatedUsers = new Set(state.onlineUsers);
        if (data.online) {
          updatedUsers.add(data.userId);
        } else {
          updatedUsers.delete(data.userId);
        }
        return { onlineUsers: Array.from(updatedUsers) };
      });
    });

    return socket;
  },

  isUserOnline: (userId: string) => get().onlineUsers.includes(userId),
}));