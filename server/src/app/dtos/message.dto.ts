import { IMessage } from '../models/message.model';

export interface MessageResponseDTO {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export const toMessageDTO = (message: IMessage): MessageResponseDTO => ({
  _id: message._id.toString(),
  senderId: message.senderId.toString(),
  receiverId: message.receiverId.toString(),
  content: message.content,
  timestamp: message.timestamp,
  read: message.read,
});
