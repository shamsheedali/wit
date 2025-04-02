import { IClub } from '../../models/club.model';

export interface IClubService {
  // Create operation
  createClub(
    name: string,
    description: string | undefined,
    clubType: 'public' | 'private',
    adminIds: string[],
    memberIds: string[]
  ): Promise<IClub>;

  // Join operation
  joinClub(clubId: string, userId: string): Promise<IClub>;

  // Read operations
  getPublicClubs(search: string): Promise<IClub[]>;
  getUserClubs(userId: string): Promise<IClub[]>;
}
