import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import TournamentService from '../services/tournament.service';
import HttpStatus from '../../constants/httpStatus';
import { MissingFieldError } from '../../utils/http-error.util';

@injectable()
export default class TournamentController {
  private _tournamentService: TournamentService;

  constructor(@inject(TYPES.TournamentService) tournamentService: TournamentService) {
    this._tournamentService = tournamentService;
  }

  async createTournament(req: Request, res: Response) {
    const { name, timeControl, maxGames, createdBy } = req.body;
    if (!name || !timeControl || !maxGames || !createdBy) {
      throw new MissingFieldError('name, timeControl, maxGames, or createdBy');
    }
    const tournament = await this._tournamentService.createTournament(
      name,
      timeControl,
      maxGames,
      createdBy
    );
    res.status(HttpStatus.CREATED).json({ message: 'Tournament created', tournament });
  }

  async joinTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;
    if (!tournamentId || !userId) throw new MissingFieldError('tournamentId or userId');
    const tournament = await this._tournamentService.joinTournament(tournamentId, userId);
    res.status(HttpStatus.OK).json({ message: 'Joined tournament', tournament });
  }

  async startTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;
    if (!tournamentId || !userId) throw new MissingFieldError('tournamentId or userId');
    const tournament = await this._tournamentService.startTournament(tournamentId, userId);
    res.status(HttpStatus.OK).json({ message: 'Tournament started', tournament });
  }

  async getTournaments(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { tournaments, total } = await this._tournamentService.getTournaments(page, limit);
    res
      .status(HttpStatus.OK)
      .json({ tournaments, total, page, totalPages: Math.ceil(total / limit) });
  }

  async getUserTournaments(req: Request, res: Response) {
    const userId = req.query.userId as string;
    if (!userId) throw new MissingFieldError('userId');
    const tournaments = await this._tournamentService.findByUserId(userId);
    res.status(HttpStatus.OK).json({ tournaments });
  }

  async getTournament(req: Request, res: Response) {
    const { tournamentId } = req.params;
    if (!tournamentId) throw new MissingFieldError('tournamentId');
    const tournament = await this._tournamentService.getTournament(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    res.status(HttpStatus.OK).json({ tournament });
  }

  async submitResult(req: Request, res: Response) {
    const { tournamentId, matchId, result, userId } = req.body;
    if (!tournamentId || !matchId || !result || !userId) {
      throw new MissingFieldError('tournamentId, matchId, result, or userId');
    }
    const tournament = await this._tournamentService.submitResult(
      tournamentId,
      matchId,
      result,
      userId
    );
    res.status(HttpStatus.OK).json({ message: 'Result submitted', tournament });
  }

  async submitPlayoffResult(req: Request, res: Response) {
    const { tournamentId, result, userId } = req.body;
    if (!tournamentId || !result || !userId) {
      throw new MissingFieldError('tournamentId, result, or userId');
    }
    const tournament = await this._tournamentService.submitPlayoffResult(
      tournamentId,
      result,
      userId
    );
    res.status(HttpStatus.OK).json({ message: 'Playoff result submitted', tournament });
  }

  async pairMatch(req: Request, res: Response) {
    const { tournamentId } = req.body;
    const userId = req.user?.userId;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');
    const match = await this._tournamentService.pairMatch(tournamentId, userId);
    if (!match) {
      return res.status(HttpStatus.OK).json({ message: 'No available opponents' });
    }
    res.status(HttpStatus.OK).json({ message: 'Match paired', match });
  }
}
