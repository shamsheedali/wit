import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import MessageService from '../services/message.service';
import TYPES from '../../config/types';
import { MissingFieldError, UnauthorizedError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import { sendCreated, sendSuccess } from '../../utils/response.util';
import { toMessageDTO } from '../dtos/message.dto';

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

    return sendCreated(res, toMessageDTO(message), HttpResponse.MESSAGE_SENT);
  }

  async getMessages(req: Request, res: Response) {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;

    if (!currentUserId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);
    if (!userId) throw new MissingFieldError('userId');

    const messages = await this._messageService.getMessages(currentUserId, userId);

    return sendSuccess(res, messages.map(toMessageDTO), HttpResponse.MESSAGES_FETCHED);
  }
}
