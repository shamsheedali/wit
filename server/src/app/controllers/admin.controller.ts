import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import HttpStatus from '../../constants/httpStatus';
import UserService from '../services/user.service';
import TokenService from '../services/token.service';
import GameService from '../services/game.service';
import TYPES from '../../config/types';
import AdminService from '../services/admin.service';
import Role from '../../constants/role';
import {
  ApplicationError,
  MissingFieldError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import log from '../../utils/logger';

@injectable()
export default class AdminController {
  private _adminService: AdminService;
  private _userService: UserService;
  private _tokenService: TokenService;
  private _gameService: GameService;

  constructor(
    @inject(TYPES.AdminService) adminService: AdminService,
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.GameService) gameService: GameService
  ) {
    this._adminService = adminService;
    this._userService = userService;
    this._tokenService = tokenService;
    this._gameService = gameService;
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) throw new MissingFieldError('email');
    if (!password) throw new MissingFieldError('password');

    const admin = await this._adminService.findByEmail(email);
    if (!admin) throw new UnauthorizedError(HttpResponse.INVALID_CREDENTIALS);

    const isPasswordValid = await this._userService.isPasswordValid(password, admin.password);
    if (!isPasswordValid) throw new UnauthorizedError(HttpResponse.PASSWORD_INCORRECT);

    const accessToken = this._tokenService.generateAccessToken(email, Role.ADMIN);

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
    if (!updatedUser)
      throw new ApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to toggle ban status');

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
    if (!game) throw new NotFoundError('Game not found');

    res.status(HttpStatus.OK).json({ message: 'Game deleted successfully' });
  }

  async terminateGame(req: Request, res: Response) {
    const gameId = req.params.gameId;
    if (!gameId) throw new BadRequestError('Game ID is required');

    const game = await this._gameService.terminateGame(gameId);
    if (!game) throw new NotFoundError('Game not found');

    res.status(HttpStatus.OK).json({ message: 'Game terminated successfully', game });
  }

  async getUserGrowth(req: Request, res: Response) {
    const { period = 'daily' } = req.query; // daily, weekly, monthly
    const growthData = await this._userService.getUserGrowth(period as string);

    res.status(HttpStatus.OK).json(growthData);
  }

  async getTotalUsers(req: Request, res: Response) {
    const totalUsers = await this._userService.getTotalUsers();
    res.status(HttpStatus.OK).json({ total: totalUsers });
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.adminRefreshToken;
    if (!refreshToken) throw new UnauthorizedError(HttpResponse.NO_TOKEN);

    let decoded;
    try {
      decoded = this._tokenService.verifyToken(refreshToken, process.env.REFRESH_JWT_SECRET!);
    } catch (error) {
      log.error(error);
      throw new UnauthorizedError(HttpResponse.TOKEN_EXPIRED);
    }
    const { email, role } = decoded as { email: string; role: string };

    const newAccessToken = this._tokenService.generateAccessToken(email, role);
    const newRefreshToken = this._tokenService.generateRefreshToken(email, role);
    this._tokenService.setRefreshTokenCookie(res, newRefreshToken, true); // Admin-specific

    res.status(HttpStatus.OK).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  }
}
