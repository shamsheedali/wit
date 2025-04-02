import { inject, injectable } from 'inversify';
import BaseRepository from '../../core/base.repository';
import { IFriendRequest } from '../models/friendRequest.model';
import { Model } from 'mongoose';
import TYPES from '../../config/types';
import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model';
import { IFriendRepository } from './interface/IFriendRepository';

@injectable()
export default class FriendRepository
  extends BaseRepository<IFriendRequest>
  implements IFriendRepository
{
  constructor(@inject(TYPES.FriendRequestModel) friendRequestModel: Model<IFriendRequest>) {
    super(friendRequestModel);
  }

  async create(data: Partial<IFriendRequest>): Promise<IFriendRequest> {
    return super.create(data);
  }

  async createFriendRequest(senderId: string, receiverId: string): Promise<IFriendRequest> {
    const request = {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
    };
    return this.create(request);
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).populate('friends', 'username profileImageUrl').exec();
  }

  async findPending(senderId: string, receiverId: string): Promise<IFriendRequest | null> {
    return this.model
      .findOne({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        status: 'pending',
      })
      .exec();
  }

  async findRequestsForUser(userId: string): Promise<IFriendRequest[]> {
    return this.model
      .find({
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) },
        ],
      })
      .populate('senderId', 'username profileImageUrl')
      .exec();
  }

  async updateStatus(id: string, status: 'accepted' | 'ignored'): Promise<IFriendRequest | null> {
    return this.model.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }
}
