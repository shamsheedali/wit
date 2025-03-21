import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import BaseRepository from "../../core/base.repository";
import { IGame } from "../models/game.model";
import { IGameInput } from "../dtos/game.dto";
import TYPES from "../../config/types";

@injectable()
export default class GameRepository extends BaseRepository<IGame> {
  constructor(@inject(TYPES.GameModel) gameModel: Model<IGame>) {
    super(gameModel);
  }

  async saveGame(gameData: IGameInput): Promise<IGame> {
    return this.create(gameData);
  }

  async getGamesByUserId(userId: string): Promise<IGame[]> {
    return this.model
      .find({
        $or: [{ playerOne: userId }, { playerTwo: userId }],
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
  }
}