import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import HttpStatus from '../../constants/httpStatus';
import GameReportService from '../services/gameReport.service';
import TYPES from '../../config/types';
import { MissingFieldError, UnauthorizedError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';

@injectable()
export default class GameReportController {
  private _gameReportService: GameReportService;

  constructor(@inject(TYPES.GameReportService) gameReportService: GameReportService) {
    this._gameReportService = gameReportService;
  }

  async createReport(req: Request, res: Response) {
    const { gameId, reportedUserId, reason, details } = req.body;
    const reportingUserId = req.user?.userId;

    if (!reportingUserId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);
    if (!gameId) throw new MissingFieldError('gameId');
    if (!reportedUserId) throw new MissingFieldError('reportedUserId');
    if (!reason) throw new MissingFieldError('reason');

    const report = await this._gameReportService.createReport({
      gameId,
      reportingUserId,
      reportedUserId,
      reason,
      details,
    });

    res.status(HttpStatus.CREATED).json({
      message: HttpResponse.REPORT_SUBMITTED,
      data: report,
    });
  }

  async getReports(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);

    const reports = await this._gameReportService.getReports();

    res.status(HttpStatus.OK).json({
      message: HttpResponse.REPORTS_FETCHED,
      data: reports,
    });
  }
}
