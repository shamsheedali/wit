import { IGame, GameResult, GameType, LossType, GameStatus, IMove } from "../../models/game.model";

export interface IGameService {
  // Create operation
  saveGame(
    playerOne: string,
    playerTwo: string,
    playerAt: string,
    fen: string,
    gameType: GameType,
    timeControl: string,
    moves?: IMove[]
  ): Promise<IGame>;

  // Update operation
  updateGame(
    gameId: string,
    updateData: Partial<{
      result: GameResult;
      fen: string;
      moves: IMove[];
      lossType: LossType;
      gameDuration: number;
      gameStatus: GameStatus;
    }>
  ): Promise<IGame | null>;

  // Read operations
  getUserGames(userId: string): Promise<IGame[]>;
  getAllGames(page: number, limit: number): Promise<{
    games: IGame[];
    totalGames: number;
    totalPages: number;
  }>;
  findOngoingGameByUserId(userId: string): Promise<IGame | null>;
  getTotalGames(): Promise<number>;

  // Delete operations
  deleteGame(gameId: string): Promise<IGame | null>;
  terminateGame(gameId: string): Promise<IGame | null>;
}