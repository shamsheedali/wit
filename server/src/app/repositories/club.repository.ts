import { inject, injectable } from 'inversify';
import { Model, Types } from 'mongoose';
import BaseRepository from '../../core/base.repository';
import { IClub } from '../models/club.model';
import TYPES from '../../config/types';
import { IClubRepository } from './interface/IClubRepository';

@injectable()
export default class ClubRepository extends BaseRepository<IClub> implements IClubRepository {
  constructor(@inject(TYPES.ClubModel) clubModel: Model<IClub>) {
    super(clubModel);
  }

  async findByUserId(userId: string): Promise<IClub[]> {
    return this.model.find({ members: new Types.ObjectId(userId) }).exec();
  }

  async findByName(name: string): Promise<IClub | null> {
    return this.model.findOne({ name }).exec();
  }

  async addMember(clubId: string, userId: string): Promise<IClub | null> {
    return this.model
      .findByIdAndUpdate(clubId, { $addToSet: { members: userId } }, { new: true })
      .populate('admins', 'username email')
      .populate('members', 'username email')
      .exec();
  }

  async update(
    clubId: string,
    updateData: Partial<IClub> & { $addToSet?: { members?: { $each: Types.ObjectId[] } } }
  ): Promise<IClub | null> {
    return this.model
      .findByIdAndUpdate(clubId, updateData, { new: true })
      .populate('admins', 'username email')
      .populate('members', 'username email')
      .exec();
  }

  async findPublicClubs(query: any): Promise<IClub[]> {
    return this.model.find(query).exec();
  }

  async findAllPaginated(skip: number, limit: number): Promise<IClub[]> {
    return this.model
      .find()
      .skip(skip)
      .limit(limit)
      .populate('admins', 'username')
      .populate('members', 'username')
      .exec();
  }

  async countDocuments(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async removeMember(clubId: string, userId: string): Promise<IClub | null> {
    return this.model
      .findByIdAndUpdate(
        clubId,
        {
          $pull: {
            members: userId,
            admins: userId,
          },
        },
        { new: true }
      )
      .populate('admins', 'username email')
      .populate('members', 'username email')
      .exec();
  }

  async addMessage(clubId: string, senderId: string, content: string): Promise<IClub | null> {
    return this.model
      .findByIdAndUpdate(
        clubId,
        {
          $push: {
            messages: {
              senderId: new Types.ObjectId(senderId),
              content,
              timestamp: Date.now(),
            },
          },
        },
        { new: true }
      )
      .populate('admins', 'username email')
      .populate('members', 'username email')
      .exec();
  }

  async delete(clubId: string): Promise<IClub | null> {
    return await this.model.findByIdAndDelete(clubId).exec();
  }
}
