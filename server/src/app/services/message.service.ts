import { inject, injectable } from 'inversify';
import mongoose from 'mongoose';
import MessageRepository from '../repositories/message.repository';
import TYPES from '../../config/types';
import { IMessage } from '../models/message.model';

@injectable()
export default class MessageService {
  private _messageRepository: MessageRepository;

  constructor(@inject(TYPES.MessageRepository) messageRepository: MessageRepository) {
    this._messageRepository = messageRepository;
  }

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<IMessage> {
    const message = await this._messageRepository.create({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content,
    });
    return message;
  }

  async getMessages(userId: string, otherUserId: string): Promise<IMessage[]> {
    const messages = await this._messageRepository.findMessagesBetweenUsers(userId, otherUserId);
    await this._messageRepository.markMessagesAsRead(userId, otherUserId);
    return messages;
  }
}
