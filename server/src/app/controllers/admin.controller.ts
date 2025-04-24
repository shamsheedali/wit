import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import HttpStatus from '../../constants/httpStatus';
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

@injectable()
export default class AdminController {
  private _adminService: AdminService;
  private _userService: UserService;
  private _tokenService: TokenService;
  private _gameService: GameService;
  private _clubService: ClubService;
  private _tournamentService: TournamentService;

  constructor(
    @inject(TYPES.AdminService) adminService: AdminService,
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.GameService) gameService: GameService,
    @inject(TYPES.ClubService) clubService: ClubService,
    @inject(TYPES.TournamentService) tournamentService: TournamentService
  ) {
    this._adminService = adminService;
    this._userService = userService;
    this._tokenService = tokenService;
    this._gameService = gameService;
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
      admin._id as string,
      email,
      Role.ADMIN
    );

    res.status(HttpStatus.OK).json({
      message: HttpResponse.LOGIN_SUCCESS,
      accessToken,
      admin,
    });
  }

  async getUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;
    const skip = (page - 1) * limit;

    const users = await this._userService.findAllPaginated(skip, limit);
    const totalUsers = await this._userService.getTotalUsers();

    res.status(HttpStatus.OK).json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  }

  async toggleBan(req: Request, res: Response) {
    const userId = req.params.id;
    if (!userId) throw new BadRequestError('User ID is required');

    const user = await this._userService.findById(userId);
    if (!user) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    const updatedUser = await this._userService.update(userId, { isBanned: !user.isBanned });
    if (!updatedUser) throw new BadRequestError('Failed to toggle ban status');

    res.status(HttpStatus.OK).json({
      message: updatedUser.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      user: updatedUser,
    });
  }

  async getAllGames(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;

    const { games, totalGames, totalPages } = await this._gameService.getAllGames(page, limit);

    res.status(HttpStatus.OK).json({
      games,
      totalGames,
      totalPages,
      currentPage: page,
    });
  }

  async deleteGame(req: Request, res: Response) {
    const gameId = req.params.gameId;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const game = await this._gameService.deleteGame(gameId);
    if (!game) throw new NotFoundError(HttpResponse.GAME_NOT_FOUND);

    res.status(HttpStatus.OK).json({ message: 'Game deleted successfully' });
  }

  async terminateGame(req: Request, res: Response) {
    const gameId = req.params.gameId;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const game = await this._gameService.terminateGame(gameId);
    if (!game) throw new NotFoundError(HttpResponse.GAME_NOT_FOUND);

    res.status(HttpStatus.OK).json({ message: 'Game terminated successfully', game });
  }

  async getAllTournaments(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;

    const { tournaments, total } = await this._tournamentService.getTournaments(page, limit);

    res.status(HttpStatus.OK).json({
      tournaments,
      totalTournaments: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
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

    res.status(HttpStatus.OK).json({
      message: 'Tournament created successfully',
      tournament,
    });
  }

  async deleteTournament(req: Request, res: Response) {
    const tournamentId = req.params.tournamentId;
    if (!tournamentId) throw new BadRequestError('Tournament ID is required');

    const tournament = await this._tournamentService.deleteTournament(tournamentId);
    if (!tournament) throw new NotFoundError('Tournament not found');

    res.status(HttpStatus.OK).json({ message: 'Tournament deleted successfully' });
  }

  async getUserGrowth(req: Request, res: Response) {
    const { period = 'daily' } = req.query;
    const growthData = await this._userService.getUserGrowth(period as string);

    res.status(HttpStatus.OK).json(growthData);
  }

  async getTotalUsers(req: Request, res: Response) {
    const totalUsers = await this._userService.getTotalUsers();
    res.status(HttpStatus.OK).json({ total: totalUsers });
  }

  async getAllClubs(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 7;

    const { clubs, totalClubs, totalPages } = await this._clubService.getAllClubs(page, limit);

    res.status(HttpStatus.OK).json({
      clubs,
      totalClubs,
      totalPages,
      currentPage: page,
    });
  }

  async createClub(req: Request, res: Response) {
    const { name, description, userId } = req.body;

    if (!name) throw new MissingFieldError('name');
    if (!userId) throw new MissingFieldError('userId');

    const club = await this._clubService.createAdminClub(name, description, userId);

    res.status(HttpStatus.CREATED).json({
      message: 'Club created successfully',
      club,
    });
  }

  async deleteClub(req: Request, res: Response) {
    const clubId = req.params.clubId;
    if (!clubId) throw new BadRequestError('Club ID is required');

    const club = await this._clubService.deleteAdminClub(clubId);
    if (!club) throw new NotFoundError('Club not found');

    res.status(HttpStatus.OK).json({ message: 'Club deleted successfully' });
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.adminRefreshToken;
    if (!refreshToken) throw new UnauthorizedError(HttpResponse.NO_TOKEN);

    const decoded = this._tokenService.verifyToken(refreshToken, process.env.REFRESH_JWT_SECRET!);
    const { userId, email, role } = decoded as { userId: string; email: string; role: string };

    const newAccessToken = this._tokenService.generateAccessToken(userId, email, role);
    const newRefreshToken = this._tokenService.generateRefreshToken(userId, email, role);
    this._tokenService.setRefreshTokenCookie(res, newRefreshToken, true);

    res.status(HttpStatus.OK).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  }
}
