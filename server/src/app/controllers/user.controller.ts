import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import HttpStatus from '../../constants/httpStatus';
import UserService from '../services/user.service';
import TokenService from '../services/token.service';
import TYPES from '../../config/types';
import { CreateUserDTO, GoogleUserInput, LoginUserDTO } from '../dtos/user.dto';
import MailService from '../services/mail.service';
import redisClient from '../../config/redis';
import { ApplicationError, MissingFieldError } from '../../utils/http-error.util';
import HttpResponse from '../../constants/response-message.constant';
import Role from '../../constants/role';
import log from '../../utils/logger';

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

  // USER_SIGN_UP
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
      throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.USERNAME_EXIST);
    } else {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.USER_EXIST);
    }
  }

  // USER_LOG_IN
  async login(req: Request, res: Response) {
    const dto: LoginUserDTO = req.body;

    if (!dto.email) throw new MissingFieldError('email');
    if (!dto.password) throw new MissingFieldError('password');

    const user = await this._userService.loginUser(dto);

    const accessToken = this._tokenService.generateAccessToken(dto.email, Role.USER);
    const refreshToken = this._tokenService.generateRefreshToken(dto.email, Role.USER);
    this._tokenService.setRefreshTokenCookie(res, refreshToken);

    res.status(HttpStatus.OK).json({
      message: 'Login Successful',
      user, // LoginResponseDTO, no googleId or password
      accessToken,
    });
  }

  //CHECK_USERNAME_EXIST
  async checkUsername(req: Request, res: Response) {
    const query: { username?: string } = req.query;
    const username = query.username;

    if (!username) {
      throw new MissingFieldError('username');
    }

    const existingUser = await this._userService.findByUsername(username);
    if (existingUser) {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, 'Username already exists');
    }

    res.status(HttpStatus.OK).json({ message: 'Username verified' });
  }

  // GOOGLE_AUTH
  async googleUser(req: Request, res: Response) {
    const dto: GoogleUserInput = req.body;

    if (!dto.googleId) throw new MissingFieldError('googleId');
    if (!dto.username) throw new MissingFieldError('username');
    if (!dto.email) throw new MissingFieldError('email');

    const user = await this._userService.googleUser(dto);

    const accessToken = this._tokenService.generateAccessToken(dto.email, Role.USER);
    const refreshToken = this._tokenService.generateRefreshToken(dto.email, Role.USER);
    this._tokenService.setRefreshTokenCookie(res, refreshToken);

    res.status(HttpStatus.OK).json({
      message: 'Google auth successful',
      accessToken,
      user,
    });
  }

  //VERIFY_PASSWORD
  async verifyPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'All fields are required' });
      }

      const user = await this._userService.findByEmail(email);
      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User not available' });
      }

      const passwordValidation = await this._userService.isPasswordValid(password, user.password);

      if (!passwordValidation) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid password' });
      }

      return res.status(HttpStatus.OK).json({ message: 'Password matched' });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // FORGOT_PASSWORD
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email is required' });
      }

      const user = await this._userService.findByEmail(email);

      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User not available' });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || '',
        to: email,
        subject: 'Password Reset Verification Link',
        text: `Click this link to reset your password ${process.env.RESET_PASSWORD_LINK}`,
      };

      this._mailService.sendMail(mailOptions);

      return res.status(HttpStatus.OK).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
  }

  // RESET_PASSWORD
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'All fields are required' });
      }

      const user = await this._userService.findByEmail(email);

      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User not available' });
      }

      const hashedPassword = await this._userService.hashPassword(newPassword);
      const updateData = {
        password: hashedPassword,
      };
      await this._userService.update(user._id.toString(), updateData);

      return res.status(HttpStatus.OK).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
  }

  //SENT_OTP_MAIL
  async sendOtp(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      const user = await this._userService.findByEmail(email);

      if (user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User already exists' });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000);
      const otp = generatedOtp.toString();

      const mailOptions = {
        from: process.env.EMAIL_USER || '',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}.`,
      };

      this._mailService.sendMail(mailOptions);
      //STORING OTP IN REDIS
      try {
        await redisClient.set(`otp:${email}`, otp, { EX: 300 }); //5 min
      } catch (error) {
        console.error(error);
      }
      log.info(`SHARED OTP: ${otp}`);

      return res.status(HttpStatus.OK).json({ message: 'OTP mail shared' });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
  }

  //VERIFY_OTP
  async verifyOtp(req: Request, res: Response): Promise<Response> {
    try {
      const { otpValue, email } = req.body;

      const storedOtp = await redisClient.get(`otp:${email}`);

      if (!storedOtp) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'OTP expired' });
      }

      if (otpValue !== storedOtp) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid OTP' });
      }

      //OTP matched, removing from redis
      await redisClient.del(`otp:${email}`);

      return res.status(HttpStatus.OK).json({ message: 'OTP Verified' });
    } catch (error) {
      console.error(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error While matching OTP' });
    }
  }

  //SEARCH_USER_BY_USERNAME
  async searchUser(req: Request, res: Response): Promise<Response> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid search query' });
      }

      const users = await this._userService.searchUser(query);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      log.error(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  //GET_USER
  async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const { username } = req.params;
      const user = await this._userService.findByUsername(username as string);
      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User not found' });
      }
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      log.error(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  //UPDATE_USER_PROFILE
  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not found!' });
      }

      const profileImage = req.file;
      const userData = req.body;

      const updatedUser = await this._userService.updateUserProfile(userId, userData, profileImage);

      if (!updatedUser) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not found!' });
      }

      return res.status(HttpStatus.OK).json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error', error });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new ApplicationError(HttpStatus.UNAUTHORIZED, 'No refresh token provided');
      }

      const decoded = this._tokenService.verifyToken(refreshToken, process.env.REFRESH_JWT_SECRET!);
      const { email, role } = decoded as { email: string; role: string };

      const newAccessToken = this._tokenService.generateAccessToken(email, role);
      const newRefreshToken = this._tokenService.generateRefreshToken(email, role);
      this._tokenService.setRefreshTokenCookie(res, newRefreshToken, false); // User-specific

      res.status(HttpStatus.OK).json({
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('User Refresh Token Error:', error);
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid or expired refresh token' });
    }
  }

  // GET ALL USERS
  async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 7;
      const skip = (page - 1) * limit;

      const users = await this._userService.findAllPaginated(skip, limit);
      const totalUsers = await this._userService.getTotalUsers();

      return res.status(HttpStatus.OK).json({
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error fetching users',
        error,
      });
    }
  }
}
