import { Schema, model, models, Document, Types } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  type: 'league';
  timeControl: string;
  maxGames: number;
  players: {
    userId: Types.ObjectId;
    points: number;
    gamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
  }[];
  matches: {
    player1Id: Types.ObjectId;
    player2Id: Types.ObjectId;
    result?: '1-0' | '0-1' | '0.5-0.5' | null;
    _id: Types.ObjectId;
  }[];
  status: 'pending' | 'active' | 'playoff' | 'completed';
  createdBy: Types.ObjectId;
  startDate?: number;
  playoffMatch?: {
    player1Id: Types.ObjectId;
    player2Id: Types.ObjectId;
    result?: '1-0' | '0-1' | null;
  };
}

const tournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  type: { type: String, enum: ['league'], default: 'league' },
  timeControl: { type: String, required: true },
  maxGames: { type: Number, required: true },
  players: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
      points: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
    },
  ],
  matches: [
    {
      player1Id: { type: Schema.Types.ObjectId, ref: 'Users' },
      player2Id: { type: Schema.Types.ObjectId, ref: 'Users' },
      result: { type: String, enum: ['1-0', '0-1', '0.5-0.5', null], default: null },
      _id: { type: Schema.Types.ObjectId, auto: true },
    },
  ],
  status: { type: String, enum: ['pending', 'active', 'playoff', 'completed'], default: 'pending' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  startDate: { type: Number },
  playoffMatch: {
    player1Id: { type: Schema.Types.ObjectId, ref: 'Users' },
    player2Id: { type: Schema.Types.ObjectId, ref: 'Users' },
    result: { type: String, enum: ['1-0', '0-1', null], default: null },
  },
});

export default models.Tournament || model<ITournament>('Tournament', tournamentSchema);
