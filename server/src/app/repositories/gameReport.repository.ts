import { inject, injectable } from 'inversify';
import { Model } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { IGameReport } from '../models/gameReport.model';
import TYPES from '../../config/types';

@injectable()
export default class GameReportRepository extends BaseRepository<IGameReport> {
  constructor(@inject(TYPES.GameReportModel) gameReportModel: Model<IGameReport>) {
    super(gameReportModel);
  }

  async create(reportData: Partial<IGameReport>): Promise<IGameReport> {
    return await this.model.create(reportData);
  }

  async findAll(): Promise<IGameReport[]> {
    return await this.model
      .find()
      .populate('gameId', 'fen moves')
      .populate('reportingUserId', 'username')
      .populate('reportedUserId', 'username')
      .exec();
  }
}
