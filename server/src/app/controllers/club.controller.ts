import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import ClubService from '../services/club.service';
import { MissingFieldError, BadRequestError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import { sendCreated, sendSuccess } from '../../utils/response.util';

@injectable()
export default class ClubController {
  private _clubService: ClubService;

  constructor(@inject(TYPES.ClubService) clubService: ClubService) {
    this._clubService = clubService;
  }

  async createClub(req: Request, res: Response) {
    const { name, description, clubType, adminIds, memberIds, userId } = req.body;

    if (!name) throw new MissingFieldError('name');
    if (!clubType) throw new MissingFieldError('clubType');
    if (!userId) throw new MissingFieldError('userId');

    if (!['public', 'private'].includes(clubType)) {
      throw new BadRequestError('Invalid club type. Must be "public" or "private"');
    }

    // Ensure the requesting user is included in adminIds if not provided
    const admins = adminIds && adminIds.length ? adminIds : [userId];

    const club = await this._clubService.createClub(
      name,
      description,
      clubType,
      admins,
      memberIds || []
    );

    return sendCreated(res, club, HttpResponse.CLUB_CREATION_SUCCESS);
  }

  async joinClub(req: Request, res: Response) {
    const { clubId, userId } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');

    const updatedClub = await this._clubService.joinClub(clubId, userId);
    return sendSuccess(res, updatedClub, HttpResponse.CLUB_JOINED_SUCCESS);
  }

  async getPublicClubs(req: Request, res: Response) {
    const { search } = req.query;
    const clubs = await this._clubService.getPublicClubs((search as string) || '');
    return sendSuccess(res, clubs);
  }

  async getUserClubs(req: Request, res: Response) {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      throw new MissingFieldError('userId');
    }

    const clubs = await this._clubService.getUserClubs(userId);
    return sendSuccess(res, clubs);
  }

  async leaveClub(req: Request, res: Response) {
    const { clubId, userId } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');

    const updatedClub = await this._clubService.leaveClub(clubId, userId);
    return sendSuccess(res, updatedClub, HttpResponse.CLUB_LEFT_SUCCESS);
  }

  async updateClub(req: Request, res: Response) {
    const { clubId, userId, name, description, maxMembers, memberIds } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');
    if (!name) throw new MissingFieldError('name');

    const updatedClub = await this._clubService.updateClub(
      clubId,
      userId,
      name,
      description,
      maxMembers,
      memberIds || []
    );

    return sendSuccess(res, updatedClub, HttpResponse.CLUB_UPDATED_SUCCESS);
  }

  async addMessage(req: Request, res: Response) {
    const { clubId, senderId, content } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!senderId) throw new MissingFieldError('senderId');
    if (!content) throw new MissingFieldError('content');

    const updatedClub = await this._clubService.addMessage(clubId, senderId, content);
    return sendSuccess(res, updatedClub, HttpResponse.CLUB_MESSAGE_ADDED);
  }

  async deleteClub(req: Request, res: Response) {
    const { clubId, userId } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');

    await this._clubService.deleteClub(clubId, userId);
    return sendSuccess(res, null, HttpResponse.CLUB_DELETION_SUCCESS);
  }
}
