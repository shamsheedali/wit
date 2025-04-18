import { inject, injectable } from 'inversify';
import mongoose, { Model } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { IMessage } from '../models/message.model';
import TYPES from '../../config/types';

@injectable()
export default class MessageRepository extends BaseRepository<IMessage> {
  constructor(@inject(TYPES.MessageModel) messageModel: Model<IMessage>) {
    super(messageModel);
  }

  async create(messageData: Partial<IMessage>): Promise<IMessage> {
    return await this.model.create(messageData);
  }

  async findMessagesBetweenUsers(userId: string, otherUserId: string): Promise<IMessage[]> {
    return await this.model
      .find({
        $or: [
          {
            senderId: new mongoose.Types.ObjectId(userId),
            receiverId: new mongoose.Types.ObjectId(otherUserId),
          },
          {
            senderId: new mongoose.Types.ObjectId(otherUserId),
            receiverId: new mongoose.Types.ObjectId(userId),
          },
        ],
      })
      .sort({ timestamp: 1 })
      .exec();
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await this.model
      .updateMany(
        {
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(userId),
          read: false,
        },
        { $set: { read: true } }
      )
      .exec();
  }
}
