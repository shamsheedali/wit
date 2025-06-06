import { Document, model, Schema, Types } from 'mongoose';

export interface IClub extends Document {
  name: string;
  description?: string;
  clubType: 'public' | 'private';
  admins: Types.ObjectId[];
  members?: Types.ObjectId[];
  maxMembers?: number;
  createdBy: 'user' | 'admin';
  messages?: {
    senderId: Types.ObjectId;
    content: string;
    timestamp: number;
  }[];
}

const clubSchema = new Schema<IClub>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    clubType: {
      type: String,
      enum: ['public', 'private'],
      required: true,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
      },
    ],
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Users',
      },
    ],
    maxMembers: {
      type: Number,
    },
    createdBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Number, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default model<IClub>('Club', clubSchema);
