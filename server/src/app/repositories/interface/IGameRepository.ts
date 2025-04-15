import { IGame } from '../../models/game.model';
import { IGameInput } from '../../dtos/game.dto';

export interface IGameRepository {
  // Create operation
  saveGame(gameData: IGameInput): Promise<IGame>;

  // Update operation
  updateGame(id: string, gameData: Partial<IGameInput>): Promise<IGame | null>;

  // Find operations
  getGamesByUserId(userId: string, skip: number, limit: number): Promise<IGame[]>;
  findAllPaginated(skip: number, limit: number): Promise<IGame[]>;
  findOngoingGameByUserId(userId: string): Promise<IGame | null>;

  // Count operations
  countGames(): Promise<number>;
  countGamesByUserId(userId: string): Promise<number>;

  // Delete operation
  deleteGame(id: string): Promise<IGame | null>;

  // Game status operation
  terminateGame(id: string): Promise<IGame | null>;
}
