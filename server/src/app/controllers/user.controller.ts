import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import HttpStatus from "../../constants/httpStatus";
import UserService from "../services/user.service";
import TokenService from "../services/token.service";
import { IUser } from "../models/user.model";
import UserRepository from "../repositories/user.repository";
import TYPES from "../../config/types";
import { IUserInput } from "../dtos/user.dto";

@injectable()
export default class UserController {
  private userService: UserService;
  private tokenService: TokenService;
  private userRepository: UserRepository;

  constructor(
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.UserRepository) userRepository: UserRepository
  ) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.userRepository = userRepository;
  }

  // USER_SIGN_UP
  async registerUser(req: Request, res: Response): Promise<Response> {
    try {
      const { username, email, password }: IUser = req.body;

      if (!username || !email || !password) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "All fields are required" });
      }

      const userInput: IUserInput = { username, email, password };
      const user = await this.userService.registerUser(userInput);

      if (user.isNewUser) {
        const accessToken = this.tokenService.generateAccessToken(user?.user?.email, "user");
        const refreshToken = this.tokenService.generateRefreshToken(user?.user?.email, "user");

        // Setting refreshToken as HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(HttpStatus.CREATED).json({
          message: "Signup Successful",
          newUser: user?.user,
          accessToken,
        });
      } else if (user.duplicate === "username") {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Username already exists" });
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User already exists" });
      }
    } catch (error) {
      console.error("Error Creating User", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error Creating User", error });
    }
  }

  // USER_LOG_IN
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "All fields are required" });
      }

      const user = await this.userRepository.findOneByEmail(email);
      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not available" });
      }

      const passwordValidation = await this.userService.isPasswordValid(password, user.password);

      if (!passwordValidation) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid password" });
      }

      const accessToken = this.tokenService.generateAccessToken(email, "user");
      const refreshToken = this.tokenService.generateRefreshToken(email, "user");

      // Setting refreshToken as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(HttpStatus.CREATED).json({
        message: "Login Successful",
        user,
        accessToken,
      });
    } catch (error) {
      console.error("Error while user login:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error while user login" });
    }
  }

  // GOOGLE_AUTH
  async googleUser(req: Request, res: Response): Promise<Response> {
    try {
      const { googleId, username, email, profileImage } = req.body;

      let user = await this.userRepository.findOneByEmail(email);

      if (!user) {
        user = await this.userRepository.createGoogleUser({
          googleId,
          username,
          email,
          profileImage,
        });
      }

      const accessToken = this.tokenService.generateAccessToken(email, "user");

      return res
        .status(HttpStatus.CREATED)
        .json({ message: "Google auth successful", accessToken, user });
    } catch (error) {
      console.error("Google Auth Error:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error processing Google auth" });
    }
  }
}