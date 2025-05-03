import mongoose, { Schema, Document } from 'mongoose';

export enum GameResult {
  WhiteWin = 'whiteWin',
  BlackWin = 'blackWin',
  Draw = 'draw',
}

export enum GameType {
  Blitz = 'blitz',
  Bullet = 'bullet',
  Rapid = 'rapid',
}

export enum LossType {
  Checkmate = 'checkmate',
  Resignation = 'resignation',
  Timeout = 'timeout',
  Draw = 'draw',
}

export enum GameStatus {
  Ongoing = 'ongoing',
  Completed = 'completed',
  Terminated = 'terminated',
}

export interface IMove {
  from: string;
  to: string;
  piece: string;
  san: string;
  timestamp: Date;
}

export interface IGame extends Document {
  playerOne: string;
  playerTwo: string;
  result?: GameResult;
  playerAt: string;
  fen: string;
  gameType: GameType;
  timeControl: string;
  moves: IMove[];
  lossType?: LossType;
  gameDuration?: number;
  gameStatus: GameStatus;
  eloDifference: number;
  createdAt: Date;
  updatedAt: Date;
}

const MoveSchema: Schema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  piece: { type: String, required: true },
  san: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const GameSchema: Schema = new Schema(
  {
    playerOne: { type: String, required: true },
    playerTwo: { type: String, required: true },
    result: { type: String, enum: Object.values(GameResult) },
    playerAt: { type: String, enum: ['w', 'b'], required: true },
    fen: { type: String, required: true },
    gameType: { type: String, enum: Object.values(GameType), required: true },
    timeControl: { type: String, required: true },
    moves: [MoveSchema],
    lossType: { type: String, enum: Object.values(LossType) },
    gameDuration: { type: Number },
    gameStatus: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.Ongoing,
    },
    eloDifference: {
      type: Number,
      default: 0,
    },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export default mongoose.model<IGame>('Game', GameSchema);
