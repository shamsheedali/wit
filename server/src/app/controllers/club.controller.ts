import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import ClubService from '../services/club.service';
import HttpStatus from '../../constants/httpStatus';

@injectable()
export default class ClubController {
  private _clubService: ClubService;

  constructor(@inject(TYPES.ClubService) clubService: ClubService) {
    this._clubService = clubService;
  }

  async createClub(req: Request, res: Response): Promise<Response> {
    try {
      const { name, description, clubType, adminIds, memberIds, userId } = req.body;

      if (!name || !clubType) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Name and clubType are required' });
      }

      if (!['public', 'private'].includes(clubType)) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid club type' });
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
      return res.status(HttpStatus.CREATED).json({ message: 'Club created successfully', club });
    } catch (error) {
      console.error('Error creating club:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: (error as Error).message });
    }
  }

  async joinClub(req: Request, res: Response): Promise<Response> {
    try {
      const { clubId, userId } = req.body;

      if (!clubId) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Club ID is required' });
      }

      const updatedClub = await this._clubService.joinClub(clubId, userId);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Joined club successfully', club: updatedClub });
    } catch (error) {
      console.error('Error joining club:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: (error as Error).message });
    }
  }

  async getPublicClubs(req: Request, res: Response): Promise<Response> {
    try {
      const { search } = req.query;
      const clubs = await this._clubService.getPublicClubs((search as string) || '');
      return res.status(HttpStatus.OK).json({ clubs });
    } catch (error) {
      console.error('Error fetching public clubs:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: (error as Error).message });
    }
  }

  async getUserClubs(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID is required' });
      }

      const clubs = await this._clubService.getUserClubs(userId);
      return res.status(HttpStatus.OK).json({ clubs });
    } catch (error) {
      console.error('Error fetching user clubs:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: (error as Error).message });
    }
  }
}
