import {
  CreateUserDTO,
  GoogleUserInput,
  UserResponseDTO,
  LoginUserDTO,
  LoginResponseDTO,
  GoogleUserResponseDTO,
} from '../../dtos/user.dto';
import { IUser } from '../../models/user.model';

export interface IUserService {
  registerUser(dto: CreateUserDTO): Promise<{
    user: UserResponseDTO;
    isNewUser: boolean;
    duplicate?: 'email' | 'username';
  }>;
  loginUser(dto: LoginUserDTO): Promise<LoginResponseDTO>;
  googleUser(dto: GoogleUserInput): Promise<GoogleUserResponseDTO>;
  findAllPaginated(skip: number, limit: number): Promise<IUser[]>;
  searchUser(query: string): Promise<IUser[]>;
  findByUsername(name: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  updateUserProfile(
    userId: string,
    userData: Partial<IUser>,
    profileImage?: Express.Multer.File
  ): Promise<IUser | null>;
  getUserGrowth(period: string): Promise<any>;
  getTotalUsers(): Promise<number>;
  isPasswordValid(typedPassword: string, password?: string): Promise<boolean>;
}
