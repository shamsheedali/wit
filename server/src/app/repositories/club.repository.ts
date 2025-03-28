import { inject, injectable } from "inversify";
import { Model, Types } from "mongoose";
import BaseRepository from "../../core/base.repository";
import { IClub } from "../models/club.model";
import TYPES from "../../config/types";
import { IClubRepository } from "./interface/IClubRepository";

@injectable()
export default class ClubRepository extends BaseRepository<IClub> implements IClubRepository {
  constructor(@inject(TYPES.ClubModel) clubModel: Model<IClub>) {
    super(clubModel);
  }

  async findByUserId(userId: string): Promise<IClub[]> {
    return this.model.find({ members: new Types.ObjectId(userId) }).exec();
  }

  async findByName(name: string): Promise<IClub | null> {
    return await this.model.findOne({ name });
  }

  async addMember(clubId: string, userId: string): Promise<IClub | null> {
    return await this.model
      .findByIdAndUpdate(
        clubId,
        { $addToSet: { members: userId } },
        { new: true }
      )
      .populate("admins", "username email")
      .populate("members", "username email"); // admin and member details
  }

  async findPublicClubs(query: any): Promise<IClub[]> {
    return this.model.find(query).exec();
  }
}