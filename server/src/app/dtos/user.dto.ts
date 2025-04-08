import { IUser } from '../models/user.model';

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export interface UserResponseDTO {
  _id: string;
  username: string;
  email: string;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  bio?: string;
  friends: string[] | IUser[];
  eloRating: number;
  gamesPlayed: number;
  profileImageUrl?: string;
  profileImageId?: string;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface GoogleUserInput {
  googleId: string;
  username: string;
  email: string;
  profileImageUrl?: string;
}

export interface GoogleUserResponseDTO {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  bio?: string;
  friends: string[];
  eloRating: number;
  gamesPlayed: number;
  profileImageUrl?: string;
  profileImageId?: string;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
