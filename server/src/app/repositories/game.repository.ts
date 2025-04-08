import { inject, injectable } from 'inversify';
import { Model, ClientSession } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { GameStatus, IGame } from '../models/game.model';
import { IGameInput } from '../dtos/game.dto';
import TYPES from '../../config/types';
import { IGameRepository } from './interface/IGameRepository';

@injectable()
export default class GameRepository extends BaseRepository<IGame> implements IGameRepository {
  constructor(@inject(TYPES.GameModel) gameModel: Model<IGame>) {
    super(gameModel);
  }

  async saveGame(gameData: IGameInput): Promise<IGame> {
    return this.create(gameData);
  }

  async findById(id: string): Promise<IGame | null> {
    return this.model.findById(id).exec();
  }

  async updateGame(
    id: string,
    gameData: Partial<IGameInput>,
    session?: ClientSession
  ): Promise<IGame | null> {
    return this.model.findByIdAndUpdate(id, gameData, { new: true, session }).exec();
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

  async findAllPaginated(skip: number, limit: number): Promise<IGame[]> {
    return this.model.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async countGames(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async deleteGame(id: string): Promise<IGame | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async terminateGame(id: string): Promise<IGame | null> {
    return this.model.findByIdAndUpdate(id, { gameStatus: 'terminated' }).exec();
  }

  async findOngoingGameByUserId(userId: string): Promise<IGame | null> {
    return this.model
      .findOne({
        $or: [{ playerOne: userId }, { playerTwo: userId }],
        gameStatus: GameStatus.Ongoing,
      })
      .exec();
  }
}
