import { inject, injectable } from 'inversify';
import mongoose, { Model, ClientSession, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { IUser } from '../models/user.model';
import TYPES from '../../config/types';
import { cloudinary } from '../../config/cloudinary.config';
import { IUserRepository } from './interface/IUserRepository';
import { CreateUserDTO, GoogleUserInput } from '../dtos/user.dto';
import log from '../../utils/logger';

@injectable()
export default class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(@inject(TYPES.UserModel) userModel: Model<IUser>) {
    super(userModel);
  }

  async createUser(userData: CreateUserDTO & { password: string }): Promise<IUser> {
    return await this.create(userData as Partial<IUser>);
  }

  async createGoogleUser(userData: GoogleUserInput): Promise<IUser> {
    const data: Partial<IUser> = {
      googleId: userData.googleId,
      username: userData.username,
      email: userData.email,
      profileImageUrl: userData.profileImageUrl,
    };
    return await this.create(data);
  }

  async findOneByEmail(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email });
  }

  async findOneByUsername(username: string): Promise<IUser | null> {
    return await this.model.findOne({ username }).select('-password').exec();
  }

  async findById(id: string, session?: mongoose.ClientSession): Promise<IUser | null> {
    return await this.model
      .findById(id)
      .session(session ?? null)
      .exec();
  }

  async findOneAndUpdate(
    filter: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    options?: QueryOptions
  ): Promise<IUser | null> {
    return await this.model
      .findOneAndUpdate(filter, update, {
        ...options,
        runValidators: true,
      })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<IUser>,
    session?: ClientSession
  ): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(id, updateData, { new: true, session }).exec();
  }

  async findAllPaginated(skip: number, limit: number): Promise<IUser[]> {
    return await this.model.find().skip(skip).limit(limit).select('-password').exec();
  }

  async countUsers(): Promise<number> {
    return await this.model.countDocuments().exec();
  }

  async searchUserByUsername(query: string): Promise<IUser[]> {
    return await this.model.find({
      username: { $regex: `^${query}`, $options: 'i' },
    });
  }

  async updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ): Promise<IUser | null> {
    try {
      const user = await this.findById(userId);
      if (!user) return null;

      if (profileImage) {
        if (user.profileImageId) {
          await cloudinary.uploader.destroy(user.profileImageId);
        }
        const result = await cloudinary.uploader.upload(profileImage.path, {
          folder: 'user-profiles',
        });
        userData.profileImageUrl = result.secure_url;
        userData.profileImageId = result.public_id;
      }

      return await this.update(userId, userData);
    } catch (error) {
      log.error('Error updating profile image:', error);
      throw error;
    }
  }

  async addFriend(userId: string, friendId: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, { $addToSet: { friends: friendId } }, { new: true })
      .exec();
  }

  async removeFriend(userId: string, friendId: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, { $pull: { friends: friendId } }, { new: true })
      .exec();
  }

  async getUserGrowth(dateFormat: string): Promise<any> {
    const growthData = await this.model.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
    return growthData;
  }
}
