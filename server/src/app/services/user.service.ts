import { inject, injectable } from 'inversify';
import bcrypt from 'bcrypt';
import { IUser } from '../models/user.model';
import BaseService from '../../core/base.service';
import UserRepository from '../repositories/user.repository';
import TYPES from '../../config/types';
import { GoogleUserInput, RegisterUserInput } from '../dtos/user.dto';
import { IUserService } from './interface/IUserService';

@injectable()
export default class UserService extends BaseService<IUser> implements IUserService {
  private _userRepository: UserRepository;

  constructor(@inject(TYPES.UserRepository) userRepository: UserRepository) {
    super(userRepository);
    this._userRepository = userRepository;
  }

  async registerUser(userData: RegisterUserInput): Promise<{
    user: IUser;
    isNewUser: boolean;
    duplicate?: 'email' | 'username';
  }> {
    const { username, email, password } = userData;

    const existingUserEmail = await this._userRepository.findOneByEmail(email);
    if (existingUserEmail) {
      return { user: existingUserEmail, isNewUser: false, duplicate: 'email' };
    }

    const existingUserUsername = await this._userRepository.findOneByUsername(username);
    if (existingUserUsername) {
      return { user: existingUserUsername, isNewUser: false, duplicate: 'username' };
    }

    const hashedPassword = await this.hashPassword(password);
    const newUser = await this._userRepository.createUser({
      username,
      email,
      password: hashedPassword,
    });

    return { user: newUser, isNewUser: true };
  }

  async createGoogleUser(userData: GoogleUserInput): Promise<IUser> {
    return await this._userRepository.createGoogleUser(userData);
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async isPasswordValid(typedPassword: string, password?: string) {
    if (!password) return false;
    return await bcrypt.compare(typedPassword, password);
  }

  async findAllPaginated(skip: number, limit: number) {
    return await this._userRepository.findAllPaginated(skip, limit);
  }

  async searchUser(query: string) {
    return await this._userRepository.searchUserByUsername(query);
  }

  async findByUsername(name: string) {
    return await this._userRepository.findOneByUsername(name);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this._userRepository.findOneByEmail(email);
  }

  async updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ) {
    return await this._userRepository.updateUserProfile(userId, userData, profileImage);
  }

  async getUserGrowth(period: string): Promise<any> {
    let groupByFormat: string;
    switch (period) {
      case 'weekly':
        groupByFormat = '%Y-%U';
        break;
      case 'monthly':
        groupByFormat = '%Y-%m';
        break;
      case 'daily':
      default:
        groupByFormat = '%Y-%m-%d';
    }

    const growthData = await this._userRepository.getUserGrowth(groupByFormat);
    return growthData;
  }

  async getTotalUsers(): Promise<number> {
    return await this._userRepository.countUsers();
  }
}
