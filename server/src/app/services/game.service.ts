import { inject, injectable } from 'inversify';
import mongoose, { ClientSession } from 'mongoose';
import BaseService from '../../core/base.service';
import GameRepository from '../repositories/game.repository';
import UserService from './user.service';
import { IGame, GameResult, GameType, LossType, GameStatus, IMove } from '../models/game.model';
import { IGameInput } from '../dtos/game.dto';
import TYPES from '../../config/types';
import { IGameService } from './interface/IGameService';
import log from '../../utils/logger';

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

  async getGame(gameId: string) {
    return this._gameRepository.findById(gameId);
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
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();
        log.info(`Attempt ${attempt + 1} to update game ${gameId}`);

        const updatedGame = await this._gameRepository.findOneAndUpdate(
          { _id: gameId },
          {
            $set: updateData,
            $inc: { __v: 1 },
          },
          { session, new: true }
        );

        if (!updatedGame) {
          await session.abortTransaction();
          log.warn(`Game ${gameId} not found`);
          return null;
        }

        if (updateData.gameStatus === GameStatus.Completed && updateData.result) {
          await this.updatePlayerRatings(updatedGame, updateData.result, session);
        }

        await session.commitTransaction();
        log.info(`Successfully updated game ${gameId}`);
        return updatedGame;
      } catch (error: any) {
        await session.abortTransaction();

        if (error.code === 112 || error.message.includes('Write conflict')) {
          lastError = error;
          attempt++;
          const delay = 100 * Math.pow(2, attempt);
          log.warn(`Write conflict on game ${gameId}, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        log.error(`Error updating game ${gameId}:`, error);
        throw error;
      } finally {
        session.endSession();
      }
    }

    log.error(`Max retries reached for game ${gameId} update`);
    throw lastError || new Error('Max retries reached due to persistent write conflicts');
  }

  private async updatePlayerRatings(
    game: IGame,
    result: GameResult,
    session: ClientSession
  ): Promise<void> {
    try {
      const [playerOne, playerTwo] = await Promise.all([
        this._userService.findById(game.playerOne, session),
        this._userService.findById(game.playerTwo, session),
      ]);

      if (!playerOne || !playerTwo) {
        throw new Error('One or both players not found');
      }

      const playerOneResult = this.getPlayerResult(game.playerAt, result);
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

      await this._gameRepository.findOneAndUpdate(
        { _id: game._id },
        {
          $set: {
            eloDifference: playerOneEloChange,
          },
          $inc: { __v: 1 },
        },
        { session, new: true }
      );

      await Promise.all([
        this._userService.findOneAndUpdate(
          { _id: game.playerOne },
          {
            $inc: {
              eloRating: playerOneEloChange,
              gamesPlayed: 1,
            },
          },
          { session }
        ),
        this._userService.findOneAndUpdate(
          { _id: game.playerTwo },
          {
            $inc: {
              eloRating: playerTwoEloChange,
              gamesPlayed: 1,
            },
          },
          { session }
        ),
      ]);
    } catch (error) {
      log.error(`Error updating ratings for game ${game._id}:`, error);
      throw error;
    }
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
    return this._gameRepository.findOneAndUpdate(
      { _id: gameId },
      { gameStatus: GameStatus.Terminated }
    );
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
