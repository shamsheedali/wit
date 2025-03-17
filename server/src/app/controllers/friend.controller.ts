import { inject, injectable } from 'inversify';
import { Request, Response } from 'express'; // Correct import
import FriendService from '../services/friend.service';
import TYPES from '../../config/types';
import HttpStatus from '../../constants/httpStatus';
import { Server } from 'socket.io'; // Import Server type

@injectable()
export default class FriendController {
  private friendService: FriendService;

  constructor(@inject(TYPES.FriendService) friendService: FriendService) {
    this.friendService = friendService;
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
      const { userId } = req.body;
      const requests = await this.friendService.getFriendRequests(userId);
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
}