import { inject, injectable } from "inversify";
import UserRepository from "../repositories/user.repository";
import TYPES from "../../config/types";
import FriendRepository from "../repositories/friend.repository";
import { IFriendRequest } from "../models/friendRequest.model";
import { Server } from "socket.io";

@injectable()
export default class FriendService {
  private userRepository: UserRepository;
  private friendRepository: FriendRepository;

  constructor(
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.FriendRepository) friendRepository: FriendRepository
  ) {
    this.userRepository = userRepository;
    this.friendRepository = friendRepository;
  }

  async sendFriendRequest(senderId: string, receiverId: string, io: Server): Promise<IFriendRequest> {
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }
  
    const existingRequest = await this.friendRepository.findPending(senderId, receiverId);
    if (existingRequest) {
      throw new Error('Friend request already sent');
    }
  
    const request = await this.friendRepository.createFriendRequest(senderId, receiverId); 
    io.to(receiverId).emit('friendRequest', {
      _id: request._id,
      senderId,
      receiverId,
      status: request.status,
      createdAt: request.createdAt,
    });
  
    return request;
  }

  async getFriendRequests(userId: string): Promise<IFriendRequest[]> {
    return this.friendRepository.findRequestsForUser(userId);
  }

  async updateFriendRequest(
    requestId: string,
    userId: string,
    status: "accepted" | "ignored",
    io: Server
  ): Promise<IFriendRequest> {
    const request = await this.friendRepository.findById(requestId);
    if (!request || request.receiverId.toString() !== userId) {
      throw new Error("Friend request not found or unauthorized");
    }

    const updatedRequest = await this.friendRepository.updateStatus(
      requestId,
      status
    );

    if (!updatedRequest) {
      throw new Error("Failed to update friend request");
    }

    if (status === "accepted") {
      // Add each user to the other's friends list
      await this.userRepository.addFriend(
        request.senderId.toString(),
        request.receiverId.toString()
      );
      await this.userRepository.addFriend(
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
}
