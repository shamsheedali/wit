import { IClub } from '../../models/club.model';

export interface IClubRepository {
  // Find operations
  findByUserId(userId: string): Promise<IClub[]>;
  findByName(name: string): Promise<IClub | null>;
  findPublicClubs(query: any): Promise<IClub[]>;

  // Update operation
  addMember(clubId: string, userId: string): Promise<IClub | null>;
}
