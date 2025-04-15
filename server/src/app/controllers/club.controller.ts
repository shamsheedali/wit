import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import ClubService from '../services/club.service';
import HttpStatus from '../../constants/httpStatus';
import { MissingFieldError, BadRequestError } from '../../utils/http-error.util';

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

    res.status(HttpStatus.CREATED).json({ message: 'Club created successfully', club });
  }

  async joinClub(req: Request, res: Response) {
    const { clubId, userId } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');

    const updatedClub = await this._clubService.joinClub(clubId, userId);
    res.status(HttpStatus.OK).json({ message: 'Joined club successfully', club: updatedClub });
  }

  async getPublicClubs(req: Request, res: Response) {
    const { search } = req.query;
    const clubs = await this._clubService.getPublicClubs((search as string) || '');
    res.status(HttpStatus.OK).json({ clubs });
  }

  async getUserClubs(req: Request, res: Response) {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      throw new MissingFieldError('userId');
    }

    const clubs = await this._clubService.getUserClubs(userId);
    res.status(HttpStatus.OK).json({ clubs });
  }

  async leaveClub(req: Request, res: Response) {
    const { clubId, userId } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');

    const updatedClub = await this._clubService.leaveClub(clubId, userId);
    res.status(HttpStatus.OK).json({ message: 'Left club successfully', club: updatedClub });
  }

  async addMessage(req: Request, res: Response) {
    const { clubId, senderId, content } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!senderId) throw new MissingFieldError('senderId');
    if (!content) throw new MissingFieldError('content');

    const updatedClub = await this._clubService.addMessage(clubId, senderId, content);
    res.status(HttpStatus.OK).json({ message: 'Message added successfully', club: updatedClub });
  }

  async deleteClub(req: Request, res: Response) {
    const { clubId, userId } = req.body;

    if (!clubId) throw new MissingFieldError('clubId');
    if (!userId) throw new MissingFieldError('userId');

    await this._clubService.deleteClub(clubId, userId);
    res.status(HttpStatus.OK).json({ message: 'Club deleted successfully' });
  }
}
