import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import GameService from '../services/game.service';
import TYPES from '../../config/types';
import { MissingFieldError, BadRequestError, NotFoundError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response.util';

@injectable()
export default class GameController {
  private _gameService: GameService;

  constructor(@inject(TYPES.GameService) gameService: GameService) {
    this._gameService = gameService;
  }

  async saveGame(req: Request, res: Response) {
    const { playerOne, playerTwo, playerAt, fen, gameType, timeControl, moves } = req.body;

    if (!playerOne) throw new MissingFieldError('playerOne');
    if (!playerTwo) throw new MissingFieldError('playerTwo');
    if (!playerAt) throw new MissingFieldError('playerAt');
    if (!fen) throw new MissingFieldError('fen');
    if (!gameType) throw new MissingFieldError('gameType');
    if (!timeControl) throw new MissingFieldError('timeControl');

    const game = await this._gameService.saveGame(
      playerOne,
      playerTwo,
      playerAt,
      fen,
      gameType,
      timeControl,
      moves
    );

    return sendCreated(res, game, HttpResponse.GAME_CREATION_SUCCESS);
  }

  async getGame(req: Request, res: Response) {
    const { gameId } = req.params;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const game = await this._gameService.getGame(gameId);
    if (!game) throw new NotFoundError(HttpResponse.GAME_NOT_FOUND);

    return sendSuccess(res, game);
  }

  async updateGame(req: Request, res: Response) {
    const { gameId } = req.params;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const { result, fen, moves, lossType, gameDuration, gameStatus } = req.body;

    const updatedGame = await this._gameService.updateGame(gameId, {
      result,
      fen,
      moves,
      lossType,
      gameDuration,
      gameStatus,
    });

    if (!updatedGame) throw new NotFoundError(HttpResponse.GAME_NOT_FOUND);

    return sendSuccess(res, updatedGame, HttpResponse.GAME_UPDATED_SUCCESS);
  }

  async getUserGames(req: Request, res: Response) {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) throw new BadRequestError('User ID is required');

    const { games, total } = await this._gameService.getUserGames(userId, page, limit);

    return sendPaginated(res, games, { total, page, limit });
  }

  async getOngoingGameByUserId(req: Request, res: Response) {
    const { userId } = req.params;
    if (!userId) throw new BadRequestError('User ID is required');

    const game = await this._gameService.findOngoingGameByUserId(userId);
    if (!game) throw new NotFoundError(HttpResponse.ONGOING_GAME_NOT_FOUND);

    return sendSuccess(res, game);
  }
}
