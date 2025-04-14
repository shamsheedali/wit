import { inject, injectable } from 'inversify';
import mongoose from 'mongoose';
import BaseService from '../../core/base.service';
import GameRepository from '../repositories/game.repository';
import UserService from './user.service';
import { IGame, GameResult, GameType, LossType, GameStatus, IMove } from '../models/game.model';
import { IGameInput } from '../dtos/game.dto';
import TYPES from '../../config/types';
import { IGameService } from './interface/IGameService';

@injectable()
export default class GameService extends BaseService<IGame> implements IGameService {
  private _gameRepository: GameRepository;
  private _userService: UserService;

  constructor(
    @inject(TYPES.GameRepository) gameRepository: GameRepository,
    @inject(TYPES.UserService) userService: UserService
  ) {
    super(gameRepository);
    this._gameRepository = gameRepository;
    this._userService = userService;
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
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const game = await this._gameRepository.findById(gameId);
        if (!game) return null;

        const updatedGame = await this._gameRepository.updateGame(gameId, updateData, session);

        if (updateData.gameStatus === GameStatus.Completed && updateData.result) {
          const playerOne = await this._userService.findById(game.playerOne, session);
          const playerTwo = await this._userService.findById(game.playerTwo, session);

          if (!playerOne || !playerTwo) throw new Error('Players not found');

          const playerOneResult = this.getPlayerResult(game.playerAt, updateData.result);
          const playerTwoResult = 1 - playerOneResult;

          const playerOneEloChange = this.calculateEloChange(
            playerOne.eloRating,
            playerTwo.eloRating,
            playerOneResult
          );
          const playerTwoEloChange = this.calculateEloChange(
            playerTwo.eloRating,
            playerOne.eloRating,
            playerTwoResult
          );

          await this._userService.update(
            game.playerOne,
            {
              eloRating: playerOne.eloRating + playerOneEloChange,
              gamesPlayed: playerOne.gamesPlayed + 1,
            },
            session
          );

          await this._userService.update(
            game.playerTwo,
            {
              eloRating: playerTwo.eloRating + playerTwoEloChange,
              gamesPlayed: playerTwo.gamesPlayed + 1,
            },
            session
          );
        }

        await session.commitTransaction();
        return updatedGame;
      } catch (error: any) {
        await session.abortTransaction();
        if (
          error.message.includes('Write conflict') ||
          error.code === 112 // MongoDB write conflict error code
        ) {
          attempt++;
          if (attempt === maxRetries) {
            throw new Error('Max retries reached due to persistent write conflicts');
          }
          console.log(`Retry attempt ${attempt} due to write conflict`);
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        } else {
          throw error; // Non-retryable error
        }
      } finally {
        session.endSession();
      }
    }

    return null; // Shouldn’t reach here due to max retries throw
  }

  async getUserGames(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ games: IGame[]; total: number }> {
    const skip = (page - 1) * limit;
    const [games, total] = await Promise.all([
      this._gameRepository.getGamesByUserId(userId, skip, limit),
      this._gameRepository.countGamesByUserId(userId),
    ]);
    return { games, total };
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

  async findOngoingGameByUserId(userId: string): Promise<IGame | null> {
    return this._gameRepository.findOngoingGameByUserId(userId);
  }

  private calculateEloChange(playerRating: number, opponentRating: number, result: number): number {
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return Math.round(K * (result - expectedScore));
  }

  private getPlayerResult(playerAt: string, result: GameResult): number {
    if (result === GameResult.WhiteWin) return playerAt === 'w' ? 1 : 0;
    if (result === GameResult.BlackWin) return playerAt === 'b' ? 1 : 0;
    return 0.5;
  }
}
