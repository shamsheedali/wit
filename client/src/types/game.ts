export interface GameData {
  _id: string;
  playerOne: string;
  playerTwo: string;
  result?: "whiteWin" | "blackWin" | "draw";
  gameType: "blitz" | "bullet" | "rapid";
  timeControl: string;
  moves: ChessMove[];
  createdAt: string;
  gameStatus: "ongoing" | "completed" | "terminated";
}

export interface openings {
  eco: string;
  name: string;
  pgn: string;
}

export interface ChessMove {
  from: string;
  to: string;
  piece: string;
  san: string;
  color?: "w" | "b";
  promotion?: "q";
  timestamp?: string;
  _id?: string;
}

export type GameResult = "whiteWin" | "blackWin" | "draw";
export type GameStatus = "ongoing" | "completed" | "terminated";

export type LossType =
  | "checkmate"
  | "resignation"
  | "timeout"
  | "draw"
  | "stalemate"
  | "insufficientMaterial"
  | "threefoldRepetition";
