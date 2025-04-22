import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import TournamentService from '../services/tournament.service';
import HttpStatus from '../../constants/httpStatus';
import { MissingFieldError, BadRequestError } from '../../utils/http-error.util';

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
    if (!name || !gameType || !timeControl || !maxGames || !maxPlayers || !createdBy) {
      throw new MissingFieldError(
        'name, gameType, timeControl, maxGames, maxPlayers, or createdBy'
      );
    }
    if (password && password.length !== 6) {
      throw new BadRequestError('Password must be exactly 6 characters');
    }
    try {
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
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async joinTournament(req: Request, res: Response) {
    const { tournamentId, userId, password } = req.body;
    if (!tournamentId || !userId) {
      throw new MissingFieldError('tournamentId or userId');
    }
    try {
      const tournament = await this._tournamentService.joinTournament(
        tournamentId,
        userId,
        password
      );
      res.status(HttpStatus.OK).json({ message: 'Joined tournament', tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async startTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;
    if (!tournamentId || !userId) {
      throw new MissingFieldError('tournamentId or userId');
    }
    try {
      const tournament = await this._tournamentService.startTournament(tournamentId, userId);
      res.status(HttpStatus.OK).json({ message: 'Tournament started', tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async leaveTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;
    if (!tournamentId || !userId) {
      throw new MissingFieldError('tournamentId or userId');
    }
    try {
      const tournament = await this._tournamentService.leaveTournament(tournamentId, userId);
      res.status(HttpStatus.OK).json({ message: 'Left tournament', tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async deleteTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;
    if (!tournamentId || !userId) {
      throw new MissingFieldError('tournamentId or userId');
    }
    try {
      const tournament = await this._tournamentService.deleteTournament(tournamentId, userId);
      res.status(HttpStatus.OK).json({ message: 'Tournament deleted', tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async getTournaments(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    try {
      const { tournaments, total } = await this._tournamentService.getTournaments(page, limit);
      res
        .status(HttpStatus.OK)
        .json({ tournaments, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async getUserTournaments(req: Request, res: Response) {
    const userId = req.query.userId as string;
    if (!userId) {
      throw new MissingFieldError('userId');
    }
    try {
      const tournaments = await this._tournamentService.findByUserId(userId);
      res.status(HttpStatus.OK).json({ tournaments });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async getTournament(req: Request, res: Response) {
    const { tournamentId } = req.params;
    if (!tournamentId) {
      throw new MissingFieldError('tournamentId');
    }
    try {
      const tournament = await this._tournamentService.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      res.status(HttpStatus.OK).json({ tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async submitResult(req: Request, res: Response) {
    const { tournamentId, matchId, result, userId } = req.body;
    if (!tournamentId || !matchId || !result || !userId) {
      throw new MissingFieldError('tournamentId, matchId, result, or userId');
    }
    try {
      const tournament = await this._tournamentService.submitResult(
        tournamentId,
        matchId,
        result,
        userId
      );
      res.status(HttpStatus.OK).json({ message: 'Result submitted', tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async submitPlayoffResult(req: Request, res: Response) {
    const { tournamentId, result, userId } = req.body;
    if (!tournamentId || !result || !userId) {
      throw new MissingFieldError('tournamentId, result, or userId');
    }
    try {
      const tournament = await this._tournamentService.submitPlayoffResult(
        tournamentId,
        result,
        userId
      );
      res.status(HttpStatus.OK).json({ message: 'Playoff result submitted', tournament });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  async pairMatch(req: Request, res: Response) {
    const { tournamentId } = req.body;
    const userId = req.user?.userId;

    if (!tournamentId) {
      throw new MissingFieldError('tournamentId');
    }
    if (!userId) {
      throw new MissingFieldError('userId');
    }
    try {
      const match = await this._tournamentService.pairMatch(tournamentId, userId);
      if (!match) {
        return res.status(HttpStatus.OK).json({ message: 'No available opponents' });
      }
      res.status(HttpStatus.OK).json({ message: 'Match paired', match });
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }
}
