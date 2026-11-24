import mongoose from 'mongoose';
import { IUser } from '../models/user.model';

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface GoogleUserInput {
  googleId: string;
  username: string;
  email: string;
  profileImageUrl?: string;
}

// Whitelist for PUT /api/user/profile (prevents mass assignment)
export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
}

// Returned for the authenticated user (login, register, updateProfile, admin views)
export interface UserResponseDTO {
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
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Returned when viewing/searching OTHER players (omits private email)
export interface PublicUserDTO {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  bio?: string;
  eloRating: number;
  gamesPlayed: number;
  profileImageUrl?: string;
  createdAt: Date;
}

export const toUserDTO = (user: IUser): UserResponseDTO => ({
  _id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  email: user.email,
  bio: user.bio,
  friends: Array.isArray(user.friends)
    ? (user.friends as Array<mongoose.Types.ObjectId | IUser>).map((friend) =>
        friend instanceof mongoose.Types.ObjectId ? friend.toString() : friend._id.toString()
      )
    : [],
  eloRating: user.eloRating,
  gamesPlayed: user.gamesPlayed,
  profileImageUrl: user.profileImageUrl,
  isBanned: Boolean(user.isBanned),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toPublicUserDTO = (user: IUser): PublicUserDTO => ({
  _id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  bio: user.bio,
  eloRating: user.eloRating,
  gamesPlayed: user.gamesPlayed,
  profileImageUrl: user.profileImageUrl,
  createdAt: user.createdAt,
});
