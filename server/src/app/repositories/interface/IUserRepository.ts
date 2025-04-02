import { IUser } from '../../models/user.model';
import { IUserInput } from '../../dtos/user.dto';

export interface IUserRepository {
  // Create operations
  createUser(userData: IUserInput): Promise<IUser>;
  createGoogleUser(userData: IUserInput): Promise<IUser>;

  // Find operations
  findOneByEmail(email: string): Promise<IUser | null>;
  findOneByUsername(username: string): Promise<IUser | null>;
  findAllPaginated(skip: number, limit: number): Promise<IUser[]>;
  searchUserByUsername(query: string): Promise<IUser[]>;

  // Count operations
  countUsers(): Promise<number>;

  // Update operations
  updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ): Promise<IUser | null>;

  // Friend operations
  addFriend(userId: string, friendId: string): Promise<IUser | null>;
  removeFriend(userId: string, friendId: string): Promise<IUser | null>;

  // Analytics
  getUserGrowth(dateFormat: string): Promise<any[]>;
}
