import { GameResult, GameType, LossType, GameStatus, IMove } from "../models/game.model";

export interface IGameInput {
  playerOne: string;
  playerTwo: string;
  result?: GameResult; // Optional until game ends
  playerAt: string; // "w" or "b"
  fen: string;
  gameType: GameType;
  timeControl: string; // e.g., "3min", "5min+3sec"
  moves: IMove[];
  lossType?: LossType; // Optional, set when game ends
  gameDuration?: number; // Optional, set when game ends
  gameStatus?: GameStatus; // Optional, defaults to "ongoing"
}