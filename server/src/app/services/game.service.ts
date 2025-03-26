import { inject, injectable } from "inversify";
import BaseService from "../../core/base.service";
import GameRepository from "../repositories/game.repository";
import { IGame, GameResult, GameType, LossType, GameStatus, IMove } from "../models/game.model";
import { IGameInput } from "../dtos/game.dto";
import TYPES from "../../config/types";

@injectable()
export default class GameService extends BaseService<IGame> {
  private gameRepository: GameRepository;

  constructor(@inject(TYPES.GameRepository) gameRepository: GameRepository) {
    super(gameRepository);
    this.gameRepository = gameRepository;
  }

  async saveGame(
    playerOne: string,
    playerTwo: string,
    playerAt: string, // "w" or "b"
    fen: string,
    gameType: GameType,
    timeControl: string,
    moves: IMove[] = [] // Default to empty array
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
    return this.gameRepository.saveGame(gameData);
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
    return this.gameRepository.updateGame(gameId, updateData);
  }

  async getUserGames(userId: string): Promise<IGame[]> {
    return this.gameRepository.getGamesByUserId(userId);
  }
}