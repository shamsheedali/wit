import { inject, injectable } from 'inversify';
import mongoose from 'mongoose';
import GameReportRepository from '../repositories/gameReport.repository';
import TYPES from '../../config/types';
import { IGameReport } from '../models/gameReport.model';

@injectable()
export default class GameReportService {
  private _gameReportRepository: GameReportRepository;

  constructor(@inject(TYPES.GameReportRepository) gameReportRepository: GameReportRepository) {
    this._gameReportRepository = gameReportRepository;
  }

  async createReport(data: {
    gameId: string;
    reportingUserId: string;
    reportedUserId: string;
    reason: string;
    details?: string;
  }): Promise<IGameReport> {
    const report = await this._gameReportRepository.create({
      gameId: new mongoose.Types.ObjectId(data.gameId),
      reportingUserId: new mongoose.Types.ObjectId(data.reportingUserId),
      reportedUserId: new mongoose.Types.ObjectId(data.reportedUserId),
      reason: data.reason,
      details: data.details || '',
    });
    return report;
  }

  async getReports(): Promise<IGameReport[]> {
    return await this._gameReportRepository.findAll();
  }
}
