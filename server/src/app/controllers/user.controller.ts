import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import HttpStatus from "../../constants/httpStatus";
import UserService from "../services/user.service";
import TokenService from "../services/token.service";
import { IUser } from "../models/user.model";
import TYPES from "../../config/types";
import { IUserInput } from "../dtos/user.dto";
import MailService from "../services/mail.service";
import redisClient from "../../config/redis";
import { ApplicationError, MissingFieldError } from "../../utils/http-error.util";
import HttpResponse from "../../constants/response-message.constant";

@injectable()
export default class UserController {
  private _userService: UserService;
  private _tokenService: TokenService;
  private _mailService: MailService;

  constructor(
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.MailService) mailService: MailService,
  ) {
    this._userService = userService;
    this._tokenService = tokenService;
    this._mailService = mailService;
  }

  // USER_SIGN_UP
  async registerUser(req: Request, res: Response, next: NextFunction) {
    const { username, email, password } = req.body;

    if (!username) throw new MissingFieldError('username');
    if (!email) throw new MissingFieldError('email');
    if (!password) throw new MissingFieldError('password');

    const user = await this._userService.registerUser({ username, email, password });

    if (user.isNewUser) {
      const accessToken = this._tokenService.generateAccessToken(email, 'user');
      const refreshToken = this._tokenService.generateRefreshToken(email, 'user');
      this._tokenService.setRefreshTokenCookie(res, refreshToken);

      const { password: _, ...userWithoutPassword } = user.user.toObject();

      res.status(HttpStatus.CREATED).json({
        message: HttpResponse.USER_CREATION_SUCCESS,
        user: userWithoutPassword,
        accessToken,
      });
    } else if (user.duplicate === 'username') {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.USERNAME_EXIST);
    } else {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.USER_EXIST);
    }
  }

  // USER_LOG_IN
  async login(req: Request, res: Response, next: NextFunction) {
      const { email, password } = req.body;

      if (!email) throw new MissingFieldError('email');
      if (!password) throw new MissingFieldError('password');

      const user = await this._userService.findByEmail(email);
      if (!user) {
        throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.USER_NOT_FOUND);
      }

      if(user.isBanned) {
        throw new ApplicationError(HttpStatus.FORBIDDEN, HttpResponse.USER_BANNED);
      }

      const passwordValidation = await this._userService.isPasswordValid(password, user.password);

      if (!passwordValidation) {
        throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.PASSWORD_INCORRECT);
      }

      const accessToken = this._tokenService.generateAccessToken(email, "user");
      const refreshToken = this._tokenService.generateRefreshToken(email, "user");

      this._tokenService.setRefreshTokenCookie(res, refreshToken);

      const { password: dbPassword, ...userWithoutPassword } = user.toObject(); 

      res.status(HttpStatus.CREATED).json({
        message: "Login Successful",
        user: userWithoutPassword,
        accessToken,
      });
      throw new ApplicationError(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  //CHECK_USERNAME_EXIST
  async checkUsername(req: Request, res: Response): Promise<Response> {
    try {
      const {username} = req.query;

      const isExistingUsername = await this._userService.findByUsername(username as string);

      if(isExistingUsername) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "Username already exist"})
      }

      return res.status(HttpStatus.OK).json({message: "Username verified"});
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
  }

  // GOOGLE_AUTH
  async googleUser(req: Request, res: Response): Promise<Response> {
    try {
      const { googleId, username, email, profileImage } = req.body;
  
      let newUsername = username.includes(" ") ? username.replaceAll(" ", "_") : username;
  
      let user = await this._userService.findByEmail(email);
  
      if (!user) {
        user = await this._userService.createGoogleUser({
          googleId,
          username: newUsername,
          email,
          profileImageUrl: profileImage,
        });
      }
  
      const accessToken = this._tokenService.generateAccessToken(email, "user");
  
      // Mongoose Document to plain object
      const userPlain = user.toObject();
  
      return res
        .status(HttpStatus.CREATED)
        .json({ message: "Google auth successful", accessToken, user: userPlain });
    } catch (error) {
      console.error("Google Auth Error:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error processing Google auth" });
    }
  }

  //VERIFY_PASSWORD
  async verifyPassword (req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "All fields are required" });
      }

      const user = await this._userService.findByEmail(email);
      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not available" });
      }

      const passwordValidation = await this._userService.isPasswordValid(password, user.password);

      if (!passwordValidation) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid password" });
      }

      return res.status(HttpStatus.OK).json({message: "Password matched"});
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // FORGOT_PASSWORD
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if(!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Email is required" });
      }

      const user = await this._userService.findByEmail(email);

      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not available" });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || "",
        to: email,
        subject: "Password Reset Verification Link",
        text: `Click this link to reset your password ${process.env.RESET_PASSWORD_LINK}`,
      };

      this._mailService.sendMail(mailOptions);

      return res.status(HttpStatus.OK).json({ message: "Password reset email sent" });
    } catch (error) {
      console.error(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Server error" });
    }
  }

  // RESET_PASSWORD
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email, newPassword } = req.body;

      if(!email || !newPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "All fields are required"});
      }

      const user = await this._userService.findByEmail(email);

      if(!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "User not available"});
      }

      const hashedPassword = await this._userService.hashPassword(newPassword);
      const updateData = {
        password: hashedPassword
      }
      await this._userService.update(user._id as string, updateData);

      return res.status(HttpStatus.OK).json({ message: "Password reset successfully" });
      
    } catch (error) {
      console.error(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Server error" });
    }
  }

  //SENT_OTP_MAIL
  async sendOtp(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      const user = await this._userService.findByEmail(email);

      if(user) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "User already exists"})
      }

      const generatedOtp = Math.floor(100000 + Math. random() * 900000);
      const otp = generatedOtp.toString();

      const mailOptions = {
        from: process.env.EMAIL_USER || "",
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}.`,
      };

      this._mailService.sendMail(mailOptions);
      //STORING OTP IN REDIS
      try {
        await redisClient.set(`otp:${email}`, otp, {EX: 300})//5 min
      } catch (error) {
        console.error(error);
      }
      console.log("SHARED OTP : ", otp);

      return res.status(HttpStatus.OK).json({message: "OTP mail shared"});
      } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: "Server Error"});
    }
  }

  //VERIFY_OTP
  async verifyOtp(req: Request, res: Response): Promise<Response> {
    try {
      const { otpValue, email } = req.body;

      const storedOtp = await redisClient.get(`otp:${email}`);

      if(!storedOtp) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "OTP expired"});
      }

      if(otpValue !== storedOtp) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid OTP" });
      }

      //OTP matched, removing from redis
      await redisClient.del(`otp:${email}`);

      return res.status(HttpStatus.OK).json({ message: "OTP Verified"});

    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error While matching OTP" });
    }
  }

  //SEARCH_USER_BY_USERNAME
  async searchUser(req: Request, res: Response): Promise<Response> {
    try {
      const {query} = req.query;
      if(!query || typeof query !== 'string') {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "Invalid search query"});
      }

      const users = await this._userService.searchUser(query);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
  }

  //GET_USER
  async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const {username} = req.params;
      const user = await this._userService.findByUsername(username as string);
      if(!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "User not found"});
      }
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
  }

  //UPDATE_USER_PROFILE
  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;

      if(!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({message: "User not found!"});
      }

      const profileImage = req.file;
      const userData = req.body;

      const updatedUser = await this._userService.updateUserProfile(userId, userData, profileImage);

      if(!updatedUser) {
        return res.status(HttpStatus.UNAUTHORIZED).json({message: "User not found!"});
      }

      return res.status(HttpStatus.OK).json({ 
        message: "Profile updated successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error });
    }
  }

  async getUserGrowth(req: Request, res: Response): Promise<Response> {
    try {
      const { period = "daily" } = req.query; // daily, weekly, monthly
      const growthData = await this._userService.getUserGrowth(period as string);
      return res.status(HttpStatus.OK).json(growthData);
    } catch (error) {
      console.error("Error fetching user growth:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error fetching user growth" });
    }
  }
  
  async getTotalUsers(req: Request, res: Response): Promise<Response> {
    try {
      const totalUsers = await this._userService.getTotalUsers();
      return res.status(HttpStatus.OK).json({ total: totalUsers });
    } catch (error) {
      console.error("Error fetching total users:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error fetching total users" });
    }
  }
}