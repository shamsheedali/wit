import { inject, injectable } from "inversify";
import bcrypt from "bcrypt";
import { IUser } from "../models/user.model";
import BaseService from "../../core/base.service";
import UserRepository from "../repositories/user.repository";
import TYPES from "../../config/types";
import { IUserInput } from "../dtos/user.dto";
import { IUserService } from "./interface/IUserService";

@injectable()
export default class UserService
  extends BaseService<IUser>
  implements IUserService
{
  private userRepository: UserRepository;

  constructor(@inject(TYPES.UserRepository) userRepository: UserRepository) {
    super(userRepository);
    this.userRepository = userRepository;
  }

  async registerUser(userData: IUserInput): Promise<{
    user: IUser;
    isNewUser: boolean;
    duplicate?: "email" | "username";
  }> {
    const { username, email, password } = userData;

    const existingUserEmail = await this.userRepository.findOneByEmail(email);
    if (existingUserEmail) {
      return { user: existingUserEmail, isNewUser: false, duplicate: "email" };
    }

    const existingUserUsername = await this.userRepository.findOneByUsername(
      username
    );
    if (existingUserUsername) {
      return {
        user: existingUserUsername,
        isNewUser: false,
        duplicate: "username",
      };
    }

    if (!password) {
      throw new Error("Password is required for user registration.");
    }

    const hashedPassword = await this.hashPassword(password);
    const newUser = await this.userRepository.createUser({
      username,
      email,
      password: hashedPassword,
    });

    return { user: newUser, isNewUser: true };
  }

  async createGoogleUser(userData: IUserInput) {
    return await this.userRepository.createGoogleUser(userData);
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async isPasswordValid(typedPassword: string, password?: string) {
    if (!password) return false;
    return await bcrypt.compare(typedPassword, password);
  }

  async findAllPaginated(skip: number, limit: number) {
    return await this.userRepository.findAllPaginated(skip, limit);
  }

  async searchUser(query: string) {
    return await this.userRepository.searchUserByUsername(query);
  }

  async findByUsername(name: string) {
    return await this.userRepository.findOneByUsername(name);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOneByEmail(email);
  }

  async updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ) {
    return await this.userRepository.updateUserProfile(
      userId,
      userData,
      profileImage
    );
  }

  async getUserGrowth(period: string): Promise<any> {
    let groupByFormat: string;
    switch (period) {
      case "weekly":
        groupByFormat = "%Y-%U";
        break;
      case "monthly":
        groupByFormat = "%Y-%m";
        break;
      case "daily":
      default:
        groupByFormat = "%Y-%m-%d";
    }

    const growthData = await this.userRepository.getUserGrowth(groupByFormat);
    return growthData;
  }

  async getTotalUsers(): Promise<number> {
    return await this.userRepository.countUsers();
  }
}
