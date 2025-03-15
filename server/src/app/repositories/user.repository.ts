import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import BaseRepository from "../../core/base.repository";
import { IUser } from "../models/user.model";
import { IGoogleUserInput, IUserInput } from "../dtos/user.dto";
import TYPES from "../../config/types";
import { cloudinary } from "../../config/cloudinary.config";

@injectable()
export default class UserRepository extends BaseRepository<IUser> {
  constructor(@inject(TYPES.UserModel) userModel: Model<IUser>) {
    super(userModel);
  }

  async createUser(userData: IUserInput) {
    return await this.create(userData);
  }

  async createGoogleUser(userData: IGoogleUserInput) {
    return await this.model.create(userData);
  }

  async findOneByEmail(email: string) {
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
      username: { $regex: `^${query}`, $options: "i" },
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
          folder: "user-profiles",
        });

        // Update user data with new image info
        userData.profileImageUrl = result.secure_url;
        userData.profileImageId = result.public_id;
      }

      // Update user in database
      return await this.update(userId, userData);
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  }
}