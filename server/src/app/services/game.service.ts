import { inject, injectable } from 'inversify';
import BaseService from '../../core/base.service';
import GameRepository from '../repositories/game.repository';
import { IGame, GameResult, GameType, LossType, GameStatus, IMove } from '../models/game.model';
import { IGameInput } from '../dtos/game.dto';
import TYPES from '../../config/types';
import { IGameService } from './interface/IGameService';

@injectable()
export default class GameService extends BaseService<IGame> implements IGameService {
  private _gameRepository: GameRepository;

  constructor(@inject(TYPES.GameRepository) gameRepository: GameRepository) {
    super(gameRepository);
    this._gameRepository = gameRepository;
  }

  async saveGame(
    playerOne: string,
    playerTwo: string,
    playerAt: string,
    fen: string,
    gameType: GameType,
    timeControl: string,
    moves: IMove[] = []
  ): Promise<IGame> {
    const gameData: IGameInput = {
      playerOne,
      playerTwo,
      playerAt,
      fen,
      gameType,
      timeControl,
      moves,
    };
    return this._gameRepository.saveGame(gameData);
  }

  async updateGame(
    gameId: string,
    updateData: Partial<{
      result: GameResult;
      fen: string;
      moves: IMove[];
      lossType: LossType;
      gameDuration: number;
      gameStatus: GameStatus;
    }>
  ): Promise<IGame | null> {
    return this._gameRepository.updateGame(gameId, updateData);
  }

  async getUserGames(userId: string): Promise<IGame[]> {
    return this._gameRepository.getGamesByUserId(userId);
  }

  async getAllGames(
    page: number,
    limit: number
  ): Promise<{ games: IGame[]; totalGames: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const games = await this._gameRepository.findAllPaginated(skip, limit);
    const totalGames = await this._gameRepository.countGames();
    const totalPages = Math.ceil(totalGames / limit);
    return { games, totalGames, totalPages };
  }

  async deleteGame(gameId: string): Promise<IGame | null> {
    return this._gameRepository.deleteGame(gameId);
  }

  async terminateGame(gameId: string): Promise<IGame | null> {
    return this._gameRepository.terminateGame(gameId);
  }

  async getTotalGames(): Promise<number> {
    return await this._gameRepository.countGames();
  }

  async findOngoingGameByUserId(userId: string) {
    return await this._gameRepository.findOngoingGameByUserId(userId);
  }
}
