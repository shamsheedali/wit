import { inject, injectable } from 'inversify';
import TYPES from '../../config/types';
import ClubRepository from '../repositories/club.repository';
import UserRepository from '../repositories/user.repository';
import { IClub } from '../models/club.model';
import { Types } from 'mongoose';
import { IClubService } from './interface/IClubService';
import log from '../../utils/logger';
import AdminRepository from '../repositories/admin.repository';

@injectable()
export default class ClubService implements IClubService {
  private _clubRepository: ClubRepository;
  private _userRepository: UserRepository;
  private _adminRepository: AdminRepository;

  constructor(
    @inject(TYPES.ClubRepository) clubRepository: ClubRepository,
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.AdminRepository) adminRepository: AdminRepository
  ) {
    this._clubRepository = clubRepository;
    this._userRepository = userRepository;
    this._adminRepository = adminRepository;
  }

  async createClub(
    name: string,
    description: string | undefined,
    clubType: 'public' | 'private',
    adminIds: string[],
    memberIds: string[],
    maxMembers?: number
  ): Promise<IClub> {
    log.info('Service data:', { name, description, clubType, adminIds, memberIds, maxMembers });

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

    const effectiveMaxMembers =
      maxMembers !== undefined ? maxMembers : clubType === 'public' ? 100 : 50;

    const clubData: Partial<IClub> = {
      name,
      description,
      clubType,
      admins: validAdmins,
      members: [...validAdmins, ...validMembers],
      maxMembers: effectiveMaxMembers,
    };

    log.info('clubData:', clubData);
    return this._clubRepository.create(clubData);
  }

  async updateClub(
    clubId: string,
    userId: string,
    name: string,
    description: string | undefined,
    maxMembers: number | undefined,
    memberIds: string[]
  ): Promise<IClub> {
    const club = await this._clubRepository.findById(clubId);
    if (!club) throw new Error('Club not found');

    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const userObjectId = new Types.ObjectId(userId);
    if (!club.admins?.some((id) => id.equals(userObjectId))) {
      throw new Error('Only admins can update the club');
    }

    // Check for duplicate club name
    if (name !== club.name) {
      const existingClub = await this._clubRepository.findByName(name);
      if (existingClub) throw new Error('Club name already exists');
    }

    // Validate maxMembers
    const maxLimit = club.clubType === 'public' ? 100 : 50;
    const effectiveMaxMembers = maxMembers !== undefined ? maxMembers : club.maxMembers;
    if (effectiveMaxMembers && effectiveMaxMembers > maxLimit) {
      throw new Error(`Maximum members cannot exceed ${maxLimit} for ${club.clubType} clubs`);
    }

    // Check if new members exceed maxMembers
    const newMembers = memberIds.filter(
      (id) => !club.members?.some((m) => m.equals(new Types.ObjectId(id)))
    );
    const totalMembers = (club.members?.length || 0) + newMembers.length;
    if (effectiveMaxMembers && totalMembers > effectiveMaxMembers) {
      throw new Error(
        `Total members (${totalMembers}) exceed the maximum limit (${effectiveMaxMembers})`
      );
    }

    // Validate new members
    const validNewMembers = newMembers.length
      ? await Promise.all(
          newMembers.map(async (id) => {
            const user = await this._userRepository.findById(id);
            if (!user) throw new Error(`User with ID ${id} not found`);
            return new Types.ObjectId(id);
          })
        )
      : [];

    const updatedClub = await this._clubRepository.update(clubId, {
      name,
      description,
      maxMembers: effectiveMaxMembers,
      $addToSet: { members: { $each: validNewMembers } },
    });

    if (!updatedClub) throw new Error('Failed to update club');

    return updatedClub;
  }

  async createAdminClub(
    name: string,
    description: string | undefined,
    userId: string
  ): Promise<IClub> {
    const existingClub = await this._clubRepository.findByName(name);
    if (existingClub) throw new Error('Club name already exists');

    const user = await this._adminRepository.findById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);

    const clubData: Partial<IClub> = {
      name,
      description,
      clubType: 'public',
      admins: [new Types.ObjectId(userId)],
      members: [new Types.ObjectId(userId)],
      createdBy: 'admin',
      maxMembers: 100,
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

    if (club.maxMembers && club.members && club.members.length >= club.maxMembers) {
      throw new Error('Club is full');
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

    const user =
      (await this._userRepository.findById(senderId)) ||
      (await this._adminRepository.findById(senderId));
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

    if (!club.members?.some((id) => id.equals(userObjectId))) {
      throw new Error('User is not a member of this club');
    }

    const isAdmin = club.admins?.some((id) => id.equals(userObjectId));
    if (isAdmin) {
      if (club.admins?.length === 1) {
        throw new Error(
          'Cannot leave club: You are the only admin. Please assign another admin or delete the club.'
        );
      }
    }

    const updatedClub = await this._clubRepository.removeMember(clubId, userId);
    if (!updatedClub) {
      throw new Error('Failed to leave club');
    }

    return updatedClub;
  }
}
