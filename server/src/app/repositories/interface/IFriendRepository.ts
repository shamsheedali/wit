import { IFriendRequest } from '../../models/friendRequest.model';
import { IUser } from '../../models/user.model';

export interface IFriendRepository {
  // Create operations
  create(data: Partial<IFriendRequest>): Promise<IFriendRequest>;
  createFriendRequest(senderId: string, receiverId: string): Promise<IFriendRequest>;

  // Find operations
  findUserById(userId: string): Promise<IUser | null>;
  findPending(senderId: string, receiverId: string): Promise<IFriendRequest | null>;
  findRequestsForUser(userId: string): Promise<IFriendRequest[]>;

  // Update operation
  updateStatus(id: string, status: 'accepted' | 'ignored'): Promise<IFriendRequest | null>;
}
