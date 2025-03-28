import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import HttpStatus from "../../constants/httpStatus";
import GameService from "../services/game.service";
import TYPES from "../../config/types";

@injectable()
export default class GameController {
  private _gameService: GameService;

  constructor(@inject(TYPES.GameService) gameService: GameService) {
    this._gameService = gameService;
  }

  async saveGame(req: Request, res: Response): Promise<Response> {
    try {
      const { playerOne, playerTwo, playerAt, fen, gameType, timeControl, moves } = req.body;
      const game = await this._gameService.saveGame(
        playerOne,
        playerTwo,
        playerAt,
        fen,
        gameType,
        timeControl,
        moves
      );
      return res.status(HttpStatus.CREATED).json({ game });
    } catch (error) {
      console.error("Error saving game:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to save game" });
    }
  }

  async updateGame(req: Request, res: Response): Promise<Response> {
    try {
      const { gameId } = req.params;
      const { result, fen, moves, lossType, gameDuration, gameStatus } = req.body;
      const updatedGame = await this._gameService.updateGame(gameId, {
        result,
        fen,
        moves,
        lossType,
        gameDuration,
        gameStatus,
      });
      if (!updatedGame) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: "Game not found" });
      }
      return res.status(HttpStatus.OK).json({ game: updatedGame });
    } catch (error) {
      console.error("Error updating game:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to update game" });
    }
  }

  async getUserGames(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const games = await this._gameService.getUserGames(userId);
      return res.status(HttpStatus.OK).json({ games });
    } catch (error) {
      console.error("Error fetching games:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to fetch games" });
    }
  }

  async getTotalGames(req: Request, res: Response): Promise<Response> {
    try {
      const totalGames = await this._gameService.getTotalGames();
      return res.status(HttpStatus.OK).json({ total: totalGames });
    } catch (error) {
      console.error("Error fetching total games:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error fetching total games" });
    }
  }

  async getOngoingGameByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const game = await this._gameService.findOngoingGameByUserId(userId);
      if (!game) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: "No ongoing game found for this user" });
      }
      return res.status(HttpStatus.OK).json(game);
    } catch (error) {
      console.error("Error fetching ongoing game:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
  }
}