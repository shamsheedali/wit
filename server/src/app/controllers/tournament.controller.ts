import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import TournamentService from '../services/tournament.service';
import HttpStatus from '../../constants/httpStatus';
import { MissingFieldError, BadRequestError, NotFoundError } from '../../utils/http-error.util';

@injectable()
export default class TournamentController {
  private _tournamentService: TournamentService;

  constructor(@inject(TYPES.TournamentService) tournamentService: TournamentService) {
    this._tournamentService = tournamentService;
  }

  async createTournament(req: Request, res: Response) {
    const {
      name,
      gameType,
      timeControl,
      maxGames,
      maxPlayers,
      createdBy,
      password,
      createdByAdmin,
    } = req.body;

    if (!name) throw new MissingFieldError('name');
    if (!gameType) throw new MissingFieldError('gameType');
    if (!timeControl) throw new MissingFieldError('timeControl');
    if (!maxGames) throw new MissingFieldError('maxGames');
    if (!maxPlayers) throw new MissingFieldError('maxPlayers');
    if (!createdBy) throw new MissingFieldError('createdBy');
    if (password && password.length !== 6)
      throw new BadRequestError('Password must be exactly 6 characters');

    const tournament = await this._tournamentService.createTournament(
      name,
      gameType,
      timeControl,
      maxGames,
      createdBy,
      maxPlayers,
      password,
      createdByAdmin || false
    );

    res.status(HttpStatus.CREATED).json({ message: 'Tournament created', tournament });
  }

  async joinTournament(req: Request, res: Response) {
    const { tournamentId, userId, password } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.joinTournament(tournamentId, userId, password);

    res.status(HttpStatus.OK).json({ message: 'Joined tournament', tournament });
  }

  async startTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.startTournament(tournamentId, userId);

    res.status(HttpStatus.OK).json({ message: 'Tournament started', tournament });
  }

  async leaveTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.leaveTournament(tournamentId, userId);

    res.status(HttpStatus.OK).json({ message: 'Left tournament', tournament });
  }

  async deleteTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.deleteTournament(tournamentId, userId);

    res.status(HttpStatus.OK).json({ message: 'Tournament deleted', tournament });
  }

  async getTournaments(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { tournaments, total } = await this._tournamentService.getTournaments(page, limit);

    res.status(HttpStatus.OK).json({
      tournaments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
    if (!tournament) throw new NotFoundError('Tournament not found');

    res.status(HttpStatus.OK).json({ tournament });
  }

  async submitResult(req: Request, res: Response) {
    const { tournamentId, matchId, result, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!matchId) throw new MissingFieldError('matchId');
    if (!result) throw new MissingFieldError('result');
    if (!userId) throw new MissingFieldError('userId');

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

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!result) throw new MissingFieldError('result');
    if (!userId) throw new MissingFieldError('userId');

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
