import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import HttpStatus from "../../constants/httpStatus";
import UserService from "../services/user.service";
import TokenService from "../services/token.service";
import AdminRepository from "../repositories/admin.repository";
import UserRepository from "../repositories/user.repository";
import GameService from "../services/game.service";
import TYPES from "../../config/types";

@injectable()
export default class AdminController {
  private userService: UserService;
  private tokenService: TokenService;
  private userRepository: UserRepository;
  private adminRepository: AdminRepository;
  private gameService: GameService;

  constructor(
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.AdminRepository) adminRepository: AdminRepository,
    @inject(TYPES.GameService) gameService: GameService
  ) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.userRepository = userRepository;
    this.adminRepository = adminRepository;
    this.gameService = gameService;
  }

  // ADMIN LOGIN
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "All fields are required" });
      }

      const admin = await this.adminRepository.findOneByEmail(email);

      if (!admin) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await this.userService.isPasswordValid(password, admin.password);

      if (!isPasswordValid) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid password" });
      }

      const accessToken = this.tokenService.generateAccessToken(email, "admin");

      return res.status(HttpStatus.OK).json({ message: "Admin login successful", accessToken, admin });
    } catch (error) {
      console.error("Admin Login Error:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error while admin login" });
    }
  }

  // GET ALL USERS
  async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 7;
      const skip = (page - 1) * limit;

      const users = await this.userRepository.findAllPaginated(skip, limit);
      const totalUsers = await this.userRepository.countUsers();

      return res.status(HttpStatus.OK).json({
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Error fetching users",
        error,
      });
    }
  }

  // BAN_UNBAN_USER
  async toggleBan(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;
      console.log("userId", userId);

      const user = await this.userService.findById(userId);

      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not found" });
      }

      const updatedUser = await this.userService.update(userId, { isBanned: !user.isBanned });

      return res.status(HttpStatus.OK).json({
        message: updatedUser?.isBanned ? "User banned successfully" : "User unbanned successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error toggling ban status", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server Error" });
    }
  }

  async getAllGames(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 7;

      const { games, totalGames, totalPages } = await this.gameService.getAllGames(page, limit);

      return res.status(HttpStatus.OK).json({
        games,
        totalGames,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.error("Error fetching games:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Error fetching games",
        error,
      });
    }
  }

  async deleteGame(req: Request, res: Response): Promise<Response> {
    try {
      const gameId = req.params.gameId;

      const game = await this.gameService.deleteGame(gameId);

      if (!game) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: "Game not found" });
      }

      return res.status(HttpStatus.OK).json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server Error" });
    }
  }

  async terminateGame(req: Request, res: Response): Promise<Response> {
    try {
      const gameId = req.params.gameId;

      const game = await this.gameService.terminateGame(gameId);

      if (!game) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: "Game not found" });
      }

      return res.status(HttpStatus.OK).json({ message: "Game terminated successfully", game });
    } catch (error) {
      console.error("Error deleting game:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server Error" });
    }
  }
}