import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import HttpStatus from '../../constants/httpStatus';
import MessageService from '../services/message.service';
import TYPES from '../../config/types';
import { MissingFieldError, UnauthorizedError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';

@injectable()
export default class MessageController {
  private _messageService: MessageService;

  constructor(@inject(TYPES.MessageService) messageService: MessageService) {
    this._messageService = messageService;
  }

  async sendMessage(req: Request, res: Response) {
    const { receiverId, content } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);
    if (!receiverId) throw new MissingFieldError('receiverId');
    if (!content) throw new MissingFieldError('content');

    const message = await this._messageService.sendMessage(senderId, receiverId, content);

    res.status(HttpStatus.CREATED).json({
      message: HttpResponse.MESSAGE_SENT,
      data: {
        _id: message._id,
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        content: message.content,
        timestamp: message.timestamp,
        read: message.read,
      },
    });
  }

  async getMessages(req: Request, res: Response) {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;

    if (!currentUserId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);
    if (!userId) throw new MissingFieldError('userId');

    const messages = await this._messageService.getMessages(currentUserId, userId);

    res.status(HttpStatus.OK).json({
      message: HttpResponse.MESSAGES_FETCHED,
      data: messages.map((msg) => ({
        _id: msg._id,
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId.toString(),
        content: msg.content,
        timestamp: msg.timestamp,
        read: msg.read,
      })),
    });
  }
}
