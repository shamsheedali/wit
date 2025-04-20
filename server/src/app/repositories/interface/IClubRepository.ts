import { IClub } from '../../models/club.model';
import { Types } from 'mongoose';

export interface IClubRepository {
  create(data: Partial<IClub>): Promise<IClub>;
  findById(id: string): Promise<IClub | null>;
  findByUserId(userId: string): Promise<IClub[]>;
  findByName(name: string): Promise<IClub | null>;
  addMember(clubId: string, userId: string): Promise<IClub | null>;
  update(
    clubId: string,
    updateData: Partial<IClub> & { $addToSet?: { members?: { $each: Types.ObjectId[] } } }
  ): Promise<IClub | null>;
  findPublicClubs(query: any): Promise<IClub[]>;
  findAllPaginated(skip: number, limit: number): Promise<IClub[]>;
  countDocuments(): Promise<number>;
  removeMember(clubId: string, userId: string): Promise<IClub | null>;
  addMessage(clubId: string, senderId: string, content: string): Promise<IClub | null>;
  delete(clubId: string): Promise<IClub | null>;
}
