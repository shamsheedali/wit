import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import TournamentService from '../services/tournament.service';
import {
  MissingFieldError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response.util';

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
      isClubTournament,
      clubMemberIds,
    } = req.body;

    if (!name) throw new MissingFieldError('name');
    if (!gameType) throw new MissingFieldError('gameType');
    if (!timeControl) throw new MissingFieldError('timeControl');
    if (!maxGames) throw new MissingFieldError('maxGames');
    if (!maxPlayers) throw new MissingFieldError('maxPlayers');
    if (!createdBy) throw new MissingFieldError('createdBy');
    if (password && password.length !== 6) {
      throw new BadRequestError('Password must be exactly 6 characters');
    }
    if (isClubTournament && (!clubMemberIds || !Array.isArray(clubMemberIds))) {
      throw new BadRequestError('clubMemberIds must be an array for club tournaments');
    }

    const tournament = await this._tournamentService.createTournament(
      name,
      gameType,
      timeControl,
      maxGames,
      createdBy,
      maxPlayers,
      password,
      createdByAdmin || false,
      isClubTournament || false,
      clubMemberIds || []
    );

    return sendCreated(res, tournament, HttpResponse.TOURNAMENT_CREATION_SUCCESS);
  }

  async joinTournament(req: Request, res: Response) {
    const { tournamentId, userId, password } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.joinTournament(tournamentId, userId, password);

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_JOINED_SUCCESS);
  }

  async startTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.startTournament(tournamentId, userId);

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_STARTED);
  }

  async leaveTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.leaveTournament(tournamentId, userId);

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_LEFT_SUCCESS);
  }

  async deleteTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.deleteTournament(tournamentId, userId);

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_DELETION_SUCCESS);
  }

  async getTournaments(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { tournaments, total } = await this._tournamentService.getTournaments(page, limit);

    return sendPaginated(res, tournaments, { total, page, limit });
  }

  async getUserTournaments(req: Request, res: Response) {
    const userId = req.query.userId as string;

    if (!userId) throw new MissingFieldError('userId');

    const tournaments = await this._tournamentService.findByUserId(userId);

    return sendSuccess(res, tournaments);
  }

  async getTournament(req: Request, res: Response) {
    const { tournamentId } = req.params;

    if (!tournamentId) throw new MissingFieldError('tournamentId');

    const tournament = await this._tournamentService.getTournament(tournamentId);
    if (!tournament) throw new NotFoundError(HttpResponse.TOURNAMENT_NOT_FOUND);

    return sendSuccess(res, tournament);
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

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_RESULT_SUBMITTED);
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

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_PLAYOFF_RESULT_SUBMITTED);
  }

  async pairMatch(req: Request, res: Response) {
    const { tournamentId } = req.body;
    const userId = req.user?.userId;

    if (!userId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);
    if (!tournamentId) throw new MissingFieldError('tournamentId');

    const match = await this._tournamentService.pairMatch(tournamentId, userId);
    if (!match) {
      return sendSuccess(res, null, HttpResponse.NO_AVAILABLE_OPPONENTS);
    }

    return sendSuccess(res, match, HttpResponse.MATCH_PAIRED_SUCCESS);
  }
}
