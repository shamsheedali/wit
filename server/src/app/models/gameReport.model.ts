import mongoose, { Document, Schema, model } from 'mongoose';

export interface IGameReport extends Document {
  gameId: mongoose.Types.ObjectId;
  reportingUserId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  reason: string;
  details: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

const GameReportSchema = new Schema<IGameReport>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    reportingUserId: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['cheating', 'inappropriate_behavior', 'other'],
    },
    details: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: 'timestamp' } }
);

export default model<IGameReport>('GameReports', GameReportSchema);
