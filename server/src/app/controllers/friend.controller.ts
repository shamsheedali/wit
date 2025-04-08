import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import FriendService from '../services/friend.service';
import TYPES from '../../config/types';
import HttpStatus from '../../constants/httpStatus';
import { Server } from 'socket.io';
import { MissingFieldError, BadRequestError, NotFoundError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';

@injectable()
export default class FriendController {
  private _friendService: FriendService;

  constructor(@inject(TYPES.FriendService) friendService: FriendService) {
    this._friendService = friendService;
  }

  async getFriends(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId) throw new MissingFieldError('userId');

    const friends = await this._friendService.getFriends(userId as string);
    res.status(HttpStatus.OK).json(friends);
  }

  async sendFriendRequest(req: Request, res: Response) {
    const { senderId, receiverId } = req.body;
    if (!senderId) throw new MissingFieldError('senderId');
    if (!receiverId) throw new MissingFieldError('receiverId');

    const io = req.app.get('io') as Server;
    const request = await this._friendService.sendFriendRequest(senderId, receiverId, io);

    res.status(HttpStatus.CREATED).json({ success: true, data: request });
  }

  async getFriendRequests(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId) throw new MissingFieldError('userId');

    const requests = await this._friendService.getFriendRequests(userId as string);
    res.status(HttpStatus.OK).json(requests);
  }

  async updateFriendRequest(req: Request, res: Response) {
    const { requestId } = req.params;
    const { status, userId } = req.body;

    if (!requestId) throw new BadRequestError('Request ID is required');
    if (!status) throw new MissingFieldError('status');
    if (!userId) throw new MissingFieldError('userId');

    const io = req.app.get('io') as Server;
    const updatedRequest = await this._friendService.updateFriendRequest(
      requestId,
      userId,
      status,
      io
    );

    res.status(HttpStatus.OK).json({ success: true, data: updatedRequest });
  }

  async removeFriend(req: Request, res: Response) {
    const { userId, friendId } = req.body;
    if (!userId) throw new MissingFieldError('userId');
    if (!friendId) throw new MissingFieldError('friendId');

    const updatedUser = await this._friendService.removeFriend(userId, friendId);
    if (!updatedUser) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    // Also remove from the other user
    const updatedFriend = await this._friendService.removeFriend(friendId, userId);
    if (!updatedFriend) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    res.status(HttpStatus.OK).json({ message: 'Friend removed successfully', updatedUser });
  }
}
