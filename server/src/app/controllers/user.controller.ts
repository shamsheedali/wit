// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import HttpStatus from '../../constants/httpStatus';
import UserService from '../services/user.service';
import TokenService from '../services/token.service';
import TYPES from '../../config/types';
import { CreateUserDTO, GoogleUserInput, LoginUserDTO } from '../dtos/user.dto';
import MailService from '../services/mail.service';
import redisClient from '../../config/redis';
import {
  ApplicationError,
  MissingFieldError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import Role from '../../constants/role';

@injectable()
export default class UserController {
  private _userService: UserService;
  private _tokenService: TokenService;
  private _mailService: MailService;

  constructor(
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.MailService) mailService: MailService
  ) {
    this._userService = userService;
    this._tokenService = tokenService;
    this._mailService = mailService;
  }

  async registerUser(req: Request, res: Response) {
    const dto: CreateUserDTO = req.body;

    if (!dto.username) throw new MissingFieldError('username');
    if (!dto.email) throw new MissingFieldError('email');
    if (!dto.password) throw new MissingFieldError('password');

    const userResult = await this._userService.registerUser(dto);

    if (userResult.isNewUser) {
      const accessToken = this._tokenService.generateAccessToken(dto.email, Role.USER);
      const refreshToken = this._tokenService.generateRefreshToken(dto.email, Role.USER);
      this._tokenService.setRefreshTokenCookie(res, refreshToken);

      res.status(HttpStatus.CREATED).json({
        message: HttpResponse.USER_CREATION_SUCCESS,
        user: userResult.user,
        accessToken,
      });
    } else if (userResult.duplicate === 'username') {
      throw new BadRequestError(HttpResponse.USERNAME_EXIST);
    } else {
      throw new BadRequestError(HttpResponse.USER_EXIST);
    }
  }

  async login(req: Request, res: Response) {
    const dto: LoginUserDTO = req.body;

    if (!dto.email) throw new MissingFieldError('email');
    if (!dto.password) throw new MissingFieldError('password');

    const user = await this._userService.loginUser(dto); // Already throws ApplicationError

    const accessToken = this._tokenService.generateAccessToken(dto.email, Role.USER);
    const refreshToken = this._tokenService.generateRefreshToken(dto.email, Role.USER);
    this._tokenService.setRefreshTokenCookie(res, refreshToken);

    res.status(HttpStatus.OK).json({
      message: 'Login Successful',
      user,
      accessToken,
    });
  }

  async checkUsername(req: Request, res: Response) {
    const username = req.query.username as string;

    if (!username) throw new MissingFieldError('username');

    const existingUser = await this._userService.findByUsername(username);
    if (existingUser) throw new BadRequestError(HttpResponse.USERNAME_EXIST);

    res.status(HttpStatus.OK).json({ message: 'Username verified' });
  }

  async googleUser(req: Request, res: Response) {
    const dto: GoogleUserInput = req.body;

    if (!dto.googleId) throw new MissingFieldError('googleId');
    if (!dto.username) throw new MissingFieldError('username');
    if (!dto.email) throw new MissingFieldError('email');

    const user = await this._userService.googleUser(dto); // Already throws ApplicationError

    const accessToken = this._tokenService.generateAccessToken(dto.email, Role.USER);
    const refreshToken = this._tokenService.generateRefreshToken(dto.email, Role.USER);
    this._tokenService.setRefreshTokenCookie(res, refreshToken);

    res.status(HttpStatus.OK).json({
      message: 'Google auth successful',
      accessToken,
      user,
    });
  }

  async verifyPassword(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) throw new MissingFieldError('email');
    if (!password) throw new MissingFieldError('password');

    const user = await this._userService.findByEmail(email);
    if (!user) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    const passwordValidation = await this._userService.isPasswordValid(password, user.password);
    if (!passwordValidation) throw new BadRequestError(HttpResponse.PASSWORD_INCORRECT);

    res.status(HttpStatus.OK).json({ message: HttpResponse.PASSWORD_MATCHED });
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) throw new MissingFieldError('email');

    const user = await this._userService.findByEmail(email);
    if (!user) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    const mailOptions = {
      from: process.env.EMAIL_USER || '',
      to: email,
      subject: 'Password Reset Verification Link',
      text: `Click this link to reset your password ${process.env.RESET_PASSWORD_LINK}`,
    };

    await this._mailService.sendMail(mailOptions);

    res.status(HttpStatus.OK).json({ message: HttpResponse.RESET_PASS_LINK });
  }

  async resetPassword(req: Request, res: Response) {
    const { email, newPassword } = req.body;

    if (!email) throw new MissingFieldError('email');
    if (!newPassword) throw new MissingFieldError('newPassword');

    const user = await this._userService.findByEmail(email);
    if (!user) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    const hashedPassword = await this._userService.hashPassword(newPassword);
    const updateData = { password: hashedPassword };
    const updatedUser = await this._userService.updateUserProfile(user._id.toString(), updateData);
    if (!updatedUser)
      throw new ApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to update password');

    res.status(HttpStatus.OK).json({ message: HttpResponse.PASSWORD_CHANGE_SUCCESS });
  }

  async sendOtp(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) throw new MissingFieldError('email');

    const user = await this._userService.findByEmail(email);
    if (user) throw new BadRequestError(HttpResponse.USER_EXIST);

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const mailOptions = {
      from: process.env.EMAIL_USER || '',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${generatedOtp}.`,
    };

    await this._mailService.sendMail(mailOptions);
    await redisClient.set(`otp:${email}`, generatedOtp, { EX: 300 }); // 5 min

    res.status(HttpStatus.OK).json({ message: 'OTP mail shared' });
  }

  async verifyOtp(req: Request, res: Response) {
    const { otpValue, email } = req.body;

    if (!otpValue) throw new MissingFieldError('otpValue');
    if (!email) throw new MissingFieldError('email');

    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp) throw new BadRequestError(HttpResponse.OTP_NOT_FOUND);

    if (otpValue !== storedOtp) throw new BadRequestError(HttpResponse.OTP_INCORRECT);

    await redisClient.del(`otp:${email}`);

    res.status(HttpStatus.OK).json({ message: 'OTP Verified' });
  }

  async searchUser(req: Request, res: Response) {
    const query = req.query.query as string;

    if (!query) throw new BadRequestError('Search query is required');

    const users = await this._userService.searchUser(query);
    res.status(HttpStatus.OK).json(users);
  }

  async getUser(req: Request, res: Response) {
    const { username } = req.params;

    if (!username) throw new MissingFieldError('username');

    const user = await this._userService.findByUsername(username);
    if (!user) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    res.status(HttpStatus.OK).json(user);
  }

  async updateProfile(req: Request, res: Response) {
    const userId = req.params.id;

    if (!userId) throw new UnauthorizedError(HttpResponse.UNAUTHORIZED);

    const profileImage = req.file;
    const userData = req.body;

    const updatedUser = await this._userService.updateUserProfile(userId, userData, profileImage);
    if (!updatedUser) throw new NotFoundError(HttpResponse.USER_NOT_FOUND);

    res.status(HttpStatus.OK).json({
      message: HttpResponse.RESOURCE_UPDATED,
      user: updatedUser,
    });
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new UnauthorizedError(HttpResponse.NO_TOKEN);

    const decoded = this._tokenService.verifyToken(refreshToken, process.env.REFRESH_JWT_SECRET!);
    const { email, role } = decoded as { email: string; role: string };

    const newAccessToken = this._tokenService.generateAccessToken(email, role);
    const newRefreshToken = this._tokenService.generateRefreshToken(email, role);
    this._tokenService.setRefreshTokenCookie(res, newRefreshToken, false);

    res.status(HttpStatus.OK).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
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
}
