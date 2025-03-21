import { inject, injectable } from "inversify";
import BaseService from "../../core/base.service";
import GameRepository from "../repositories/game.repository";
import { IGame, GameResult } from "../models/game.model";
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
    result: GameResult,
    playerAt: string,
    fen: string
  ): Promise<IGame> {
    const gameData: IGameInput = { playerOne, playerTwo, result, playerAt, fen };
    return this.gameRepository.saveGame(gameData);
  }

  async getUserGames(userId: string): Promise<IGame[]> {
    return this.gameRepository.getGamesByUserId(userId);
  }
}