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
        return new Types.ObjectId(id);
      })
    );

    const validMembers = memberIds.length
      ? await Promise.all(
          memberIds.map(async (id) => {
            const user = await this._userRepository.findById(id);
            if (!user) throw new Error(`User with ID ${id} not found`);
            return new Types.ObjectId(id);
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

    log.info('clubData:', clubData);
    return this._clubRepository.create(clubData);
  }

  async createAdminClub(
    name: string,
    description: string | undefined,
    userId: string
  ): Promise<IClub> {
    const existingClub = await this._clubRepository.findByName(name);
    if (existingClub) throw new Error('Club name already exists');

    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);

    const clubData: Partial<IClub> = {
      name,
      description,
      clubType: 'public', // Admins can only create public clubs
      admins: [new Types.ObjectId(userId)],
      members: [new Types.ObjectId(userId)],
    };

    log.info('Admin clubData:', clubData);
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

  async addMessage(clubId: string, senderId: string, content: string): Promise<IClub> {
    const club = await this._clubRepository.findById(clubId);
    if (!club) throw new Error('Club not found');

    const user = await this._userRepository.findById(senderId);
    if (!user) throw new Error('User not found');

    const userObjectId = new Types.ObjectId(senderId);
    if (!club.members?.some((id) => id.equals(userObjectId))) {
      throw new Error('User is not a member of this club');
    }

    const updatedClub = await this._clubRepository.addMessage(clubId, senderId, content);
    if (!updatedClub) throw new Error('Failed to add message');

    return updatedClub;
  }

  async deleteClub(clubId: string, userId: string): Promise<void> {
    const club = await this._clubRepository.findById(clubId);
    if (!club) throw new Error('Club not found');

    const userObjectId = new Types.ObjectId(userId);
    if (!club.admins?.some((id) => id.equals(userObjectId))) {
      throw new Error('Only admins can delete the club');
    }

    await this._clubRepository.delete(clubId);
  }

  async deleteAdminClub(clubId: string): Promise<IClub | null> {
    const club = await this._clubRepository.findById(clubId);
    if (!club) return null;

    await this._clubRepository.delete(clubId);
    return club;
  }

  async leaveClub(clubId: string, userId: string): Promise<IClub> {
    const club = await this._clubRepository.findById(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    // Check if user is a member
    if (!club.members?.some((id) => id.equals(userObjectId))) {
      throw new Error('User is not a member of this club');
    }

    // Check if user is an admin
    const isAdmin = club.admins?.some((id) => id.equals(userObjectId));
    if (isAdmin) {
      // Prevent the last admin from leaving
      if (club.admins?.length === 1) {
        throw new Error(
          'Cannot leave club: You are the only admin. Please assign another admin or delete the club.'
        );
      }
    }

    // Remove user from members and admins
    const updatedClub = await this._clubRepository.removeMember(clubId, userId);
    if (!updatedClub) {
      throw new Error('Failed to leave club');
    }

    return updatedClub;
  }
}
