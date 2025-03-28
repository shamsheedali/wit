import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import FriendService from '../services/friend.service';
import TYPES from '../../config/types';
import HttpStatus from '../../constants/httpStatus';
import { Server } from 'socket.io';

@injectable()
export default class FriendController {
  private friendService: FriendService;

  constructor(@inject(TYPES.FriendService) friendService: FriendService) {
    this.friendService = friendService;
  }

  async getFriends(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;
      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'User ID required' });
        return;
      }
      const friends = await this.friendService.getFriends(userId as string);
      res.status(HttpStatus.OK).json(friends);
    } catch (error: any) {
      console.error('Get friends error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async sendFriendRequest(req: Request, res: Response): Promise<void> {
    try {
      const { senderId, receiverId } = req.body;
      const io = req.app.get('io') as Server;

      const request = await this.friendService.sendFriendRequest(senderId, receiverId, io);
      res.status(HttpStatus.CREATED).json({ success: true, data: request });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getFriendRequests(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;
      if (!userId)  res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'User ID required' });
      const requests = await this.friendService.getFriendRequests(userId as string);
      res.json(requests);
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async updateFriendRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { status, userId } = req.body;
      const io = req.app.get('io') as Server;

      const updatedRequest = await this.friendService.updateFriendRequest(requestId, userId, status, io);
      res.json({ success: true, data: updatedRequest });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async removeFriend(req: Request, res: Response): Promise<void> {
    try {
      const {userId, friendId} = req.body;
      const updatedUser = await this.friendService.removeFriend(userId, friendId);

      if (!updatedUser) {
        res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });
      }

      //also remove from other user as-well
      await this.friendService.removeFriend(friendId, userId);

      res.status(HttpStatus.OK).json({message: "Removed user as friend", updatedUser});
    } catch (error) {
      console.log("Error removing friend:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
  }
}