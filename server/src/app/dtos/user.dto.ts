import { Types } from 'mongoose';
import { Expose, Type } from 'class-transformer';

export class RegisterUserInput {
  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  password!: string;
}

export class GoogleUserInput {
  @Expose()
  googleId!: string;

  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  profileImageUrl?: string;
}

export class LoginUserInput {
  @Expose()
  email!: string;

  @Expose()
  password!: string;
}

export class UserOutput {
  @Expose()
  _id!: string;

  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  bio?: string;

  @Expose()
  profileImageUrl?: string;

  @Expose()
  isBanned!: boolean;

  @Expose()
  @Type(() => String)
  friends!: string[] | Types.ObjectId[];

  @Expose()
  eloRating!: number;

  @Expose()
  gamesPlayed!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
