import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import ClubRepository from '../repositories/club.repository';
import UserRepository from '../repositories/user.repository';
import { IClub } from '../models/club.model';
import { Types } from 'mongoose';
import { IClubService } from './interface/IClubService';
import log from '../../utils/logger';

@injectable()
export default class ClubService implements IClubService {
  private _clubRepository: ClubRepository;
  private _userRepository: UserRepository;

  constructor(
    @inject(TYPES.ClubRepository) clubRepository: ClubRepository,
    @inject(TYPES.UserRepository) userRepository: UserRepository
  ) {
    this._clubRepository = clubRepository;
    this._userRepository = userRepository;
  }

  async createClub(
    name: string,
    description: string | undefined,
    clubType: 'public' | 'private',
    adminIds: string[],
    memberIds: string[]
  ): Promise<IClub> {
    log.info('Service data:', name, description, clubType, adminIds, memberIds);

    const existingClub = await this._clubRepository.findByName(name);
    if (existingClub) throw new Error('Club name already exists');

    const validAdmins = await Promise.all(
      adminIds.map(async (id) => {
        const user = await this._userRepository.findById(id);
        if (!user) throw new Error(`Admin with ID ${id} not found`);
        return new Types.ObjectId(id); // Use Types.ObjectId
      })
    );

    const validMembers = memberIds.length
      ? await Promise.all(
          memberIds.map(async (id) => {
            const user = await this._userRepository.findById(id);
            if (!user) throw new Error(`User with ID ${id} not found`);
            return new Types.ObjectId(id); // Use Types.ObjectId
          })
        )
      : [];

    const clubData: Partial<IClub> = {
      name,
      description,
      clubType,
      admins: validAdmins,
      members: [...validAdmins, ...validMembers],
    };

    log.info('clubData:', clubData); // Debug
    return this._clubRepository.create(clubData);
  }

  async joinClub(clubId: string, userId: string): Promise<IClub> {
    const club = await this._clubRepository.findById(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (club.clubType === 'private' && !club.members?.includes(userId as any)) {
      throw new Error('Cannot join private club without invitation');
    }

    const updatedClub = await this._clubRepository.addMember(clubId, userId);
    if (!updatedClub) {
      throw new Error('Failed to join club');
    }

    return updatedClub;
  }

  async getPublicClubs(search: string): Promise<IClub[]> {
    const query: { clubType: string; name?: { $regex: string; $options: string } } = {
      clubType: 'public',
    };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    return this._clubRepository.findPublicClubs(query);
  }

  async getUserClubs(userId: string): Promise<IClub[]> {
    return this._clubRepository.findByUserId(userId);
  }

  async getAllClubs(
    page: number,
    limit: number
  ): Promise<{ clubs: IClub[]; totalClubs: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const clubs = await this._clubRepository.findAllPaginated(skip, limit);
    const totalClubs = await this._clubRepository.countDocuments();
    const totalPages = Math.ceil(totalClubs / limit);
    return { clubs, totalClubs, totalPages };
  }
}
