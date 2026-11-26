import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import UserService from '../services/user.service';
import TokenService from '../services/token.service';
import GameService from '../services/game.service';
import ClubService from '../services/club.service';
import TournamentService from '../services/tournament.service';
import TYPES from '../../config/types';
import AdminService from '../services/admin.service';
import Role from '../../constants/role';
import {
  MissingFieldError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import GameReportService from '../services/gameReport.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/response.util';
import { toUserDTO } from '../dtos/user.dto';
import { toAdminDTO } from '../dtos/admin.dto';

@injectable()
export default class AdminController {
  private _adminService: AdminService;
  private _userService: UserService;
  private _tokenService: TokenService;
  private _gameService: GameService;
  private _gameReportService: GameReportService;
  private _clubService: ClubService;
  private _tournamentService: TournamentService;

  constructor(
    @inject(TYPES.AdminService) adminService: AdminService,
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.GameService) gameService: GameService,
    @inject(TYPES.GameReportService) gameReportService: GameReportService,
    @inject(TYPES.ClubService) clubService: ClubService,
    @inject(TYPES.TournamentService) tournamentService: TournamentService
  ) {
    this._adminService = adminService;
    this._userService = userService;
    this._tokenService = tokenService;
    this._gameService = gameService;
    this._gameReportService = gameReportService;
    this._clubService = clubService;
    this._tournamentService = tournamentService;
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) throw new MissingFieldError('email');
    if (!password) throw new MissingFieldError('password');

    const admin = await this._adminService.findByEmail(email);
    if (!admin) throw new UnauthorizedError(HttpResponse.INVALID_CREDENTIALS);

    const isPasswordValid = await this._userService.isPasswordValid(password, admin.password);
    if (!isPasswordValid) throw new UnauthorizedError(HttpResponse.PASSWORD_INCORRECT);

    const accessToken = this._tokenService.generateAccessToken(
      admin._id.toString(),
      email,
      Role.ADMIN
    );

    return sendSuccess(res, { admin: toAdminDTO(admin), accessToken }, HttpResponse.LOGIN_SUCCESS);
  }

  async getUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this._userService.findAllPaginated(skip, limit),
      this._userService.getTotalUsers(),
    ]);

    return sendPaginated(res, users.map(toUserDTO), { total, page, limit });
  }

  async toggleBan(req: Request, res: Response) {
    const userId = req.params.id;
    if (!userId) throw new BadRequestError('User ID is required');

    const user = await this._userService.findById(userId);
    if (!user) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    const updatedUser = await this._userService.update(userId, { isBanned: !user.isBanned });
    if (!updatedUser) throw new BadRequestError('Failed to toggle ban status');

    return sendSuccess(
      res,
      toUserDTO(updatedUser),
      updatedUser.isBanned ? HttpResponse.USER_BANNED : HttpResponse.USER_UNBANNED
    );
  }

  async getAllGames(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;

    const { games, totalGames } = await this._gameService.getAllGames(page, limit);

    return sendPaginated(res, games, { total: totalGames, page, limit });
  }

  async deleteGame(req: Request, res: Response) {
    const gameId = req.params.gameId;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const game = await this._gameService.deleteGame(gameId);
    if (!game) throw new NotFoundError(HttpResponse.GAME_NOT_FOUND);

    return sendSuccess(res, null, HttpResponse.GAME_DELETED_SUCCESS);
  }

  async terminateGame(req: Request, res: Response) {
    const gameId = req.params.gameId;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const game = await this._gameService.terminateGame(gameId);
    if (!game) throw new NotFoundError(HttpResponse.GAME_NOT_FOUND);

    return sendSuccess(res, game, HttpResponse.GAME_TERMINATED_SUCCESS);
  }

  async getAllTournaments(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;

    const { tournaments, total } = await this._tournamentService.getTournaments(page, limit);

    return sendPaginated(res, tournaments, { total, page, limit });
  }

  async createTournament(req: Request, res: Response) {
    const { name, gameType, timeControl, maxGames, maxPlayers, createdBy } = req.body;

    if (!name) throw new MissingFieldError('name');
    if (!gameType) throw new MissingFieldError('gameType');
    if (!timeControl) throw new MissingFieldError('timeControl');
    if (!maxGames) throw new MissingFieldError('maxGames');
    if (!maxPlayers) throw new MissingFieldError('maxPlayers');
    if (!createdBy) throw new MissingFieldError('createdBy');

    const tournament = await this._tournamentService.createTournament(
      name,
      gameType,
      timeControl,
      maxGames,
      createdBy,
      maxPlayers,
      undefined,
      true
    );

    return sendCreated(res, tournament, HttpResponse.TOURNAMENT_CREATION_SUCCESS);
  }

  async startTournament(req: Request, res: Response) {
    const { tournamentId, userId } = req.body;

    if (!tournamentId) throw new MissingFieldError('tournamentId');
    if (!userId) throw new MissingFieldError('userId');

    const tournament = await this._tournamentService.startTournament(tournamentId, userId);

    return sendSuccess(res, tournament, HttpResponse.TOURNAMENT_STARTED);
  }

  async deleteTournament(req: Request, res: Response) {
    const tournamentId = req.params.tournamentId;
    if (!tournamentId) throw new BadRequestError('Tournament ID is required');

    const tournament = await this._tournamentService.deleteTournamentAdmin(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament not found');

    return sendSuccess(res, null, HttpResponse.TOURNAMENT_DELETION_SUCCESS);
  }

  async getUserGrowth(req: Request, res: Response) {
    const { period = 'daily' } = req.query;
    const growthData = await this._userService.getUserGrowth(period as string);

    return sendSuccess(res, growthData);
  }

  async getTotalUsers(req: Request, res: Response) {
    const totalUsers = await this._userService.getTotalUsers();
    return sendSuccess(res, { total: totalUsers });
  }

  async getTotalGames(req: Request, res: Response) {
    const totalGames = await this._gameService.getTotalGames();
    return sendSuccess(res, { total: totalGames });
  }

  async getReports(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);

    const reports = await this._gameReportService.getReports();

    return sendSuccess(res, reports, HttpResponse.REPORTS_FETCHED);
  }

  async getAllClubs(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;

    const { clubs, totalClubs } = await this._clubService.getAllClubs(page, limit);

    return sendPaginated(res, clubs, { total: totalClubs, page, limit });
  }

  async createClub(req: Request, res: Response) {
    const { name, description, userId } = req.body;

    if (!name) throw new MissingFieldError('name');
    if (!userId) throw new MissingFieldError('userId');

    const club = await this._clubService.createAdminClub(name, description, userId);

    return sendCreated(res, club, HttpResponse.CLUB_CREATION_SUCCESS);
  }

  async deleteClub(req: Request, res: Response) {
    const clubId = req.params.clubId;
    if (!clubId) throw new BadRequestError('Club ID is required');

    const club = await this._clubService.deleteAdminClub(clubId);
    if (!club) throw new NotFoundError('Club not found');

    return sendSuccess(res, null, HttpResponse.CLUB_DELETION_SUCCESS);
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.adminRefreshToken;
    if (!refreshToken) throw new UnauthorizedError(HttpResponse.NO_TOKEN);

    const decoded = this._tokenService.verifyToken(refreshToken, process.env.REFRESH_JWT_SECRET!);
    const { userId, email, role } = decoded as { userId: string; email: string; role: string };

    const newAccessToken = this._tokenService.generateAccessToken(userId, email, role);
    const newRefreshToken = this._tokenService.generateRefreshToken(userId, email, role);
    this._tokenService.setRefreshTokenCookie(res, newRefreshToken, true);

    return sendSuccess(res, { accessToken: newAccessToken }, HttpResponse.TOKEN_REFRESHED);
  }
}
