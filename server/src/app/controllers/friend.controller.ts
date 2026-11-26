import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import FriendService from '../services/friend.service';
import TYPES from '../../config/types';
import { Server } from 'socket.io';
import { MissingFieldError, BadRequestError, NotFoundError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import { sendCreated, sendSuccess } from '../../utils/response.util';
import { toUserDTO } from '../dtos/user.dto';

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
    return sendSuccess(res, friends);
  }

  async sendFriendRequest(req: Request, res: Response) {
    const { senderId, receiverId } = req.body;
    if (!senderId) throw new MissingFieldError('senderId');
    if (!receiverId) throw new MissingFieldError('receiverId');

    const io = req.app.get('io') as Server;
    const request = await this._friendService.sendFriendRequest(senderId, receiverId, io);

    return sendCreated(res, request, HttpResponse.FRIEND_REQUEST_SENT);
  }

  async getFriendRequests(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId) throw new MissingFieldError('userId');

    const requests = await this._friendService.getFriendRequests(userId as string);
    return sendSuccess(res, requests);
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

    return sendSuccess(res, updatedRequest, HttpResponse.FRIEND_REQUEST_UPDATED);
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

    return sendSuccess(res, toUserDTO(updatedUser), HttpResponse.FRIEND_REMOVED_SUCCESS);
  }
}
