import { inject, injectable } from 'inversify';
import UserRepository from '../repositories/user.repository';
import TYPES from '../../config/types';
import FriendRepository from '../repositories/friend.repository';
import { IFriendRequest } from '../models/friendRequest.model';
import { Server } from 'socket.io';
import { IUser } from '../models/user.model';
import { IFriendService } from './interface/IFriendService';

@injectable()
export default class FriendService implements IFriendService {
  private _userRepository: UserRepository;
  private _friendRepository: FriendRepository;

  constructor(
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.FriendRepository) friendRepository: FriendRepository
  ) {
    this._userRepository = userRepository;
    this._friendRepository = friendRepository;
  }

  async getFriends(userId: string): Promise<IUser[]> {
    const user = await this._friendRepository.findUserById(userId);
    if (!user) throw new Error('User not found');
    return user.friends as IUser[];
  }

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
    io: Server
  ): Promise<IFriendRequest> {
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const existingRequest = await this._friendRepository.findPending(senderId, receiverId);
    if (existingRequest) {
      throw new Error('Friend request already sent');
    }

    const request = await this._friendRepository.createFriendRequest(senderId, receiverId);
    const sender = await this._userRepository.findById(senderId);
    io.to(receiverId).emit('friendRequest', {
      _id: request._id,
      senderId,
      receiverId,
      status: request.status,
      createdAt: request.createdAt,
    });

    io.to(receiverId).emit('notification', {
      type: 'message',
      senderId,
      senderName: sender?.username,
      content: `New friend request from ${sender?.username}`,
      timestamp: Date.now(),
    });

    return request;
  }

  async getFriendRequests(userId: string): Promise<IFriendRequest[]> {
    return this._friendRepository.findRequestsForUser(userId);
  }

  async updateFriendRequest(
    requestId: string,
    userId: string,
    status: 'accepted' | 'ignored',
    io: Server
  ): Promise<IFriendRequest> {
    const request = await this._friendRepository.findById(requestId);
    if (!request || request.receiverId.toString() !== userId) {
      throw new Error('Friend request not found or unauthorized');
    }

    const updatedRequest = await this._friendRepository.updateStatus(requestId, status);

    if (!updatedRequest) {
      throw new Error('Failed to update friend request');
    }

    if (status === 'accepted') {
      // Add each user to the other's friends list
      await this._userRepository.addFriend(
        request.senderId.toString(),
        request.receiverId.toString()
      );
      await this._userRepository.addFriend(
        request.receiverId.toString(),
        request.senderId.toString()
      );

      // Notify both users of the new friendship
      io.to(request.senderId.toString()).emit('friendshipCreated', {
        userId: request.receiverId,
      });
      io.to(request.receiverId.toString()).emit('friendshipCreated', {
        userId: request.senderId,
      });
    }

    // Notify sender of status update
    io.to(request.senderId.toString()).emit('friendRequestUpdated', {
      requestId,
      status,
    });

    return updatedRequest;
  }

  async removeFriend(userId: string, friendId: string) {
    return await this._userRepository.removeFriend(userId, friendId);
  }
}
