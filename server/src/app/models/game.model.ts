import mongoose, { Schema, Document } from "mongoose";

export enum GameResult {
  WhiteWin = "whiteWin",
  BlackWin = "blackWin",
  Draw = "draw",
}

export enum GameType {
  Blitz = "blitz",
  Bullet = "bullet",
  Rapid = "rapid",
}

export enum LossType {
  Checkmate = "checkmate",
  Resignation = "resignation",
  Timeout = "timeout",
}

export enum GameStatus {
  Ongoing = "ongoing",
  Completed = "completed",
  Terminated = "terminated",
}

export interface IMove {
  from: string;
  to: string;
  piece: string;
  san: string; // Standard Algebraic Notation (e.g., "e4", "Nf3")
  timestamp: Date;
}

export interface IGame extends Document {
  playerOne: string; // User ID
  playerTwo: string; // User ID
  result?: GameResult; // Optional until game ends
  playerAt: string; // Color of playerOne ("w" or "b")
  fen: string; // Final FEN position
  gameType: GameType;
  timeControl: string; // e.g., "3min"
  moves: IMove[];
  lossType?: LossType; 
  gameDuration?: number; // Duration in seconds, when game ends
  gameStatus: GameStatus;
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
    playerAt: { type: String, enum: ["w", "b"], required: true },
    fen: { type: String, required: true },
    gameType: { type: String, enum: Object.values(GameType), required: true },
    timeControl: { type: String, required: true },
    moves: [MoveSchema],
    lossType: { type: String, enum: Object.values(LossType) },
    gameDuration: { type: Number }, // In seconds
    gameStatus: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.Ongoing,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IGame>("Game", GameSchema);