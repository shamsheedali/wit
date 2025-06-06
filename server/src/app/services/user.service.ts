import { inject, injectable } from 'inversify';
import mongoose, { ClientSession, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../models/user.model';
import BaseService from '../../core/base.service';
import UserRepository from '../repositories/user.repository';
import TYPES from '../../config/types';
import {
  CreateUserDTO,
  GoogleUserInput,
  GoogleUserResponseDTO,
  LoginResponseDTO,
  LoginUserDTO,
  UserResponseDTO,
} from '../dtos/user.dto';
import { IUserService } from './interface/IUserService';
import { ApplicationError } from '../../utils/http-error.util';
import HttpStatus from '../../constants/httpStatus';
import HttpResponse from '../../constants/response-message.constant';

@injectable()
export default class UserService extends BaseService<IUser> implements IUserService {
  private _userRepository: UserRepository;

  constructor(@inject(TYPES.UserRepository) userRepository: UserRepository) {
    super(userRepository);
    this._userRepository = userRepository;
  }

  async registerUser(dto: CreateUserDTO): Promise<{
    user: UserResponseDTO;
    isNewUser: boolean;
    duplicate?: 'email' | 'username';
  }> {
    const { username, email, password } = dto;

    const existingUserEmail = await this._userRepository.findOneByEmail(email);
    if (existingUserEmail) {
      return {
        user: {
          _id: existingUserEmail._id.toString(),
          username: existingUserEmail.username,
          email: existingUserEmail.email,
          friends: Array.isArray(existingUserEmail.friends)
            ? (existingUserEmail.friends as mongoose.Types.ObjectId[]).map((id) => id.toString())
            : [],
          eloRating: existingUserEmail.eloRating,
          gamesPlayed: existingUserEmail.gamesPlayed,
          createdAt: existingUserEmail.createdAt,
          updatedAt: existingUserEmail.updatedAt,
        },
        isNewUser: false,
        duplicate: 'email',
      };
    }

    const existingUserUsername = await this._userRepository.findOneByUsername(username);
    if (existingUserUsername) {
      return {
        user: {
          _id: existingUserUsername._id.toString(),
          username: existingUserUsername.username,
          email: existingUserUsername.email,
          friends: Array.isArray(existingUserUsername.friends)
            ? (existingUserUsername.friends as mongoose.Types.ObjectId[]).map((id) => id.toString())
            : [],
          eloRating: existingUserUsername.eloRating,
          gamesPlayed: existingUserUsername.gamesPlayed,
          createdAt: existingUserUsername.createdAt,
          updatedAt: existingUserUsername.updatedAt,
        },
        isNewUser: false,
        duplicate: 'username',
      };
    }

    const hashedPassword = await this.hashPassword(password);
    const newUser = await this._userRepository.createUser({
      username,
      email,
      password: hashedPassword,
    });

    return {
      user: {
        _id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        friends: Array.isArray(newUser.friends)
          ? (newUser.friends as mongoose.Types.ObjectId[]).map((id) => id.toString())
          : [],
        eloRating: newUser.eloRating,
        gamesPlayed: newUser.gamesPlayed,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      isNewUser: true,
    };
  }

  async loginUser(dto: LoginUserDTO): Promise<LoginResponseDTO> {
    const { email, password } = dto;

    const user = await this.findByEmail(email);
    if (!user) {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.USER_NOT_FOUND);
    }

    if (user.isBanned) {
      throw new ApplicationError(HttpStatus.FORBIDDEN, HttpResponse.USER_BANNED);
    }

    const isValid = await this.isPasswordValid(password, user.password);
    if (!isValid) {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, HttpResponse.PASSWORD_INCORRECT);
    }

    return {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      bio: user.bio,
      friends: Array.isArray(user.friends)
        ? (user.friends as mongoose.Types.ObjectId[]).map((id) => id.toString())
        : [],
      eloRating: user.eloRating,
      gamesPlayed: user.gamesPlayed,
      profileImageUrl: user.profileImageUrl,
      profileImageId: user.profileImageId,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async googleUser(dto: GoogleUserInput): Promise<GoogleUserResponseDTO> {
    const { googleId, username, email, profileImageUrl } = dto;
    const newUsername = username.includes(' ') ? username.replace(/ /g, '_') : username;

    let user = await this._userRepository.findOneByEmail(email);
    if (!user) {
      user = await this._userRepository.createGoogleUser({
        googleId,
        username: newUsername,
        email,
        profileImageUrl,
      });
    }

    return {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      bio: user.bio,
      friends: Array.isArray(user.friends)
        ? (user.friends as mongoose.Types.ObjectId[]).map((id) => id.toString())
        : [],
      eloRating: user.eloRating,
      gamesPlayed: user.gamesPlayed,
      profileImageUrl: user.profileImageUrl,
      profileImageId: user.profileImageId,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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

  async findById(id: string, session?: mongoose.ClientSession): Promise<IUser | null> {
    return await this._userRepository.findById(id, session);
  }

  async findOneAndUpdate(
    filter: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    options?: QueryOptions
  ): Promise<IUser | null> {
    return await this._userRepository.findOneAndUpdate(filter, update, options);
  }

  async update(
    id: string,
    updateData: Partial<IUser>,
    session?: mongoose.ClientSession
  ): Promise<IUser | null> {
    return await this._userRepository.update(id, updateData, session);
  }
}
