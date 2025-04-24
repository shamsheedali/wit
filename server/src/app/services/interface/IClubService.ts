import { IClub } from '../../models/club.model';

export interface IClubService {
  createClub(
    name: string,
    description: string | undefined,
    clubType: 'public' | 'private',
    adminIds: string[],
    memberIds: string[],
    maxMembers?: number
  ): Promise<IClub>;
  updateClub(
    clubId: string,
    userId: string,
    name: string,
    description: string | undefined,
    maxMembers: number | undefined,
    memberIds: string[]
  ): Promise<IClub>;
  createAdminClub(name: string, description: string | undefined, userId: string): Promise<IClub>;
  joinClub(clubId: string, userId: string): Promise<IClub>;
  getPublicClubs(search: string): Promise<IClub[]>;
  getUserClubs(userId: string): Promise<IClub[]>;
  getAllClubs(
    page: number,
    limit: number
  ): Promise<{ clubs: IClub[]; totalClubs: number; totalPages: number }>;
  addMessage(clubId: string, senderId: string, content: string): Promise<IClub>;
  deleteClub(clubId: string, userId: string): Promise<void>;
  deleteAdminClub(clubId: string): Promise<IClub | null>;
  leaveClub(clubId: string, userId: string): Promise<IClub>;
}
