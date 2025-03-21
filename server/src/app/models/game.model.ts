import mongoose, { Schema, Document } from "mongoose";

export enum GameResult {
  WhiteWin = "whiteWin",
  BlackWin = "blackWin",
  Draw = "draw",
}

export interface IGame extends Document {
  playerOne: string; 
  playerTwo: string;
  result: GameResult;
  playerAt: string;
  fen: string; // Final FEN position
  createdAt: Date;
}

const GameSchema: Schema = new Schema({
  playerOne: { type: String, required: true },
  playerTwo: { type: String, required: true },
  result: { type: String, enum: Object.values(GameResult), required: true },
  playerAt: { type: String, required: true },
  fen: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGame>("Game", GameSchema);
