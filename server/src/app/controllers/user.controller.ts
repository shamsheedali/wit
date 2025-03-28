import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import HttpStatus from "../../constants/httpStatus";
import UserService from "../services/user.service";
import TokenService from "../services/token.service";
import { IUser } from "../models/user.model";
import UserRepository from "../repositories/user.repository";
import TYPES from "../../config/types";
import { IUserInput } from "../dtos/user.dto";
import MailService from "../services/mail.service";
import redisClient from "../../config/redis";

@injectable()
export default class UserController {
  private userService: UserService;
  private tokenService: TokenService;
  private mailService: MailService;
  private userRepository: UserRepository;

  constructor(
    @inject(TYPES.UserService) userService: UserService,
    @inject(TYPES.TokenService) tokenService: TokenService,
    @inject(TYPES.MailService) mailService: MailService,
    @inject(TYPES.UserRepository) userRepository: UserRepository
  ) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.mailService = mailService;
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
        const accessToken = this.tokenService.generateAccessToken(email, 'user');
        const refreshToken = this.tokenService.generateRefreshToken(email, 'user');
        this.tokenService.setRefreshTokenCookie(res, refreshToken);

        const { password, ...userWithoutPassword } = user.user.toObject(); 

        return res.status(HttpStatus.CREATED).json({
          message: "Signup Successful",
          user: userWithoutPassword,
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

      if(user.isBanned) {
        return res.status(HttpStatus.FORBIDDEN).json({message: "This account is banned!"});
      }

      const passwordValidation = await this.userService.isPasswordValid(password, user.password);

      if (!passwordValidation) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid password" });
      }

      const accessToken = this.tokenService.generateAccessToken(email, "user");
      const refreshToken = this.tokenService.generateRefreshToken(email, "user");

      this.tokenService.setRefreshTokenCookie(res, refreshToken);

      const { password: dbPassword, ...userWithoutPassword } = user.toObject(); 

      return res.status(HttpStatus.CREATED).json({
        message: "Login Successful",
        user: userWithoutPassword,
        accessToken,
      });
    } catch (error) {
      console.error("Error while user login:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error while user login" });
    }
  }

  //CHECK_USERNAME_EXIST
  async checkUsername(req: Request, res: Response): Promise<Response> {
    try {
      const {username} = req.query;

      const isExistingUsername = await this.userService.findByUsername(username as string);

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

      let user = await this.userService.findByEmail(email);

      if (!user) {
        user = await this.userRepository.createGoogleUser({
          googleId,
          username: newUsername,
          email,
          profileImageUrl: profileImage,
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

  //VERIFY_PASSWORD
  async verifyPassword (req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "All fields are required" });
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not available" });
      }

      const passwordValidation = await this.userService.isPasswordValid(password, user.password);

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

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not available" });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || "",
        to: email,
        subject: "Password Reset Verification Link",
        text: `Click this link to reset your password ${process.env.RESET_PASSWORD_LINK}`,
      };

      this.mailService.sendMail(mailOptions);

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

      const user = await this.userService.getUserByEmail(email);

      if(!user) {
        return res.status(HttpStatus.BAD_REQUEST).json({message: "User not available"});
      }

      const hashedPassword = await this.userService.hashPassword(newPassword);
      const updateData = {
        password: hashedPassword
      }
      await this.userService.update(user._id as string, updateData);

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
      const user = await this.userService.findByEmail(email);

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

      this.mailService.sendMail(mailOptions);
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

      const users = await this.userService.searchUser(query);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
  }

  //GET_USER
  async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const {username} = req.params;
      const user = await this.userService.findByUsername(username as string);
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

      const updatedUser = await this.userService.updateUserProfile(userId, userData, profileImage);

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
      const growthData = await this.userService.getUserGrowth(period as string);
      return res.status(HttpStatus.OK).json(growthData);
    } catch (error) {
      console.error("Error fetching user growth:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error fetching user growth" });
    }
  }
  
  async getTotalUsers(req: Request, res: Response): Promise<Response> {
    try {
      const totalUsers = await this.userService.getTotalUsers();
      return res.status(HttpStatus.OK).json({ total: totalUsers });
    } catch (error) {
      console.error("Error fetching total users:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error fetching total users" });
    }
  }
}