import { IFriendRequest } from '../../models/friendRequest.model';
import { IUser } from '../../models/user.model';
import { Server } from 'socket.io';

export interface IFriendService {
  // Friend list operations
  getFriends(userId: string): Promise<IUser[]>;

  // Friend request operations
  sendFriendRequest(senderId: string, receiverId: string, io: Server): Promise<IFriendRequest>;
  getFriendRequests(userId: string): Promise<IFriendRequest[]>;
  updateFriendRequest(
    requestId: string,
    userId: string,
    status: 'accepted' | 'ignored',
    io: Server
  ): Promise<IFriendRequest>;

  // Friend removal
  removeFriend(userId: string, friendId: string): Promise<IUser | null>;
}
