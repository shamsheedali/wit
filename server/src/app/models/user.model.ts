import mongoose, { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  password?: string;
  bio?: string;
  googleId?: string;
  friends: mongoose.Types.ObjectId[] | IUser[];
  eloRating: number;
  gamesPlayed: number;
  profileImageUrl?: string;
  profileImageId?: string;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      validate: {
        validator: function (this: IUser, value: string) {
          return !!this.googleId || !!value; // Password is required only if no Google ID
        },
        message: 'Password is required for non-Google users.',
      },
    },
    bio: {
      type: String,
    },
    googleId: {
      type: String,
      default: null,
    },
    friends: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
      },
    ],
    eloRating: {
      type: Number,
      default: 500,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    profileImageUrl: {
      type: String,
    },
    profileImageId: {
      type: String,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model<IUser>('Users', UserSchema);
