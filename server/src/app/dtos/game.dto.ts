import { GameResult } from "../models/game.model";

export interface IGameInput {
  playerOne: string;
  playerTwo: string;
  result: GameResult;
  playerAt: string;
  fen: string;
}