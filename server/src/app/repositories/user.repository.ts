import { inject, injectable } from 'inversify';
import { Model } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { IUser } from '../models/user.model';
import TYPES from '../../config/types';
import { cloudinary } from '../../config/cloudinary.config';
import { IUserRepository } from './interface/IUserRepository';
import { GoogleUserInput, RegisterUserInput } from '../dtos/user.dto';

@injectable()
export default class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(@inject(TYPES.UserModel) userModel: Model<IUser>) {
    super(userModel);
  }

  async createUser(userData: RegisterUserInput): Promise<IUser> {
    return await this.create(userData);
  }

  async createGoogleUser(userData: GoogleUserInput): Promise<IUser> {
    return await this.model.create(userData);
  }

  async findOneByEmail(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email });
  }

  async findOneByUsername(username: string) {
    return await this.model.findOne({ username });
  }

  async findAllPaginated(skip: number, limit: number) {
    return await this.model.find().skip(skip).limit(limit);
  }

  async countUsers() {
    return await this.model.countDocuments();
  }

  async searchUserByUsername(query: string) {
    return await this.model.find({
      username: { $regex: `^${query}`, $options: 'i' },
    });
  }

  async updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ) {
    try {
      const user = await this.findById(userId);

      if (!user) {
        return null;
      }

      // If profile image is provided, upload to Cloudinary
      if (profileImage) {
        // Delete existing image if it exists
        if (user.profileImageId) {
          await cloudinary.uploader.destroy(user.profileImageId);
        }

        // Upload new image to Cloudinary
        const result = await cloudinary.uploader.upload(profileImage.path, {
          folder: 'user-profiles',
        });

        // Update user data with new image info
        userData.profileImageUrl = result.secure_url;
        userData.profileImageId = result.public_id;
      }

      // Update user in database
      return await this.update(userId, userData);
    } catch (error) {
      console.error('Error updating profile image:', error);
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
