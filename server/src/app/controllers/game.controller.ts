import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import HttpStatus from "../../constants/httpStatus";
import GameService from "../services/game.service";
import TYPES from "../../config/types";

@injectable()
export default class GameController {
  private gameService: GameService;

  constructor(@inject(TYPES.GameService) gameService: GameService) {
    this.gameService = gameService;
  }

  async saveGame(req: Request, res: Response): Promise<Response> {
    try {
      const { playerOne, playerTwo, result, playerAt, fen } = req.body;
      const game = await this.gameService.saveGame(
        playerOne,
        playerTwo,
        result,
        playerAt,
        fen
      );
      return res.status(HttpStatus.CREATED).json({ game });
    } catch (error) {
      console.error("Error saving game:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to save game" });
    }
  }

  async getUserGames(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const games = await this.gameService.getUserGames(userId);
      return res.status(HttpStatus.OK).json({ games });
    } catch (error) {
      console.error("Error fetching games:", error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to fetch games" });
    }
  }
}