import { IUser } from '../../models/user.model';
import { IUserInput } from '../../dtos/user.dto';

export interface IUserService {
  // User registration
  registerUser(userData: IUserInput): Promise<{
    user: IUser;
    isNewUser: boolean;
    duplicate?: 'email' | 'username';
  }>;
  createGoogleUser(userData: IUserInput): Promise<IUser>;

  // Password operations
  hashPassword(password: string): Promise<string>;
  isPasswordValid(typedPassword: string, password?: string): Promise<boolean>;

  // Find operations
  searchUser(query: string): Promise<IUser[]>;
  findByUsername(name: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findAllPaginated(skip: number, limit: number): Promise<IUser[]>;

  // Update operation
  updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ): Promise<IUser | null>;

  // Analytics operations
  getUserGrowth(period: string): Promise<any[]>;
  getTotalUsers(): Promise<number>;
}
