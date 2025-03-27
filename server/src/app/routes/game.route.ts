import express, { Request, Response } from "express";
import container from "../../config/inversify.config";
import TYPES from "../../config/types";
import GameController from "../controllers/game.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = express.Router();
const gameController = container.get<GameController>(TYPES.GameController);

router.post("/save", async (req: Request, res: Response) => {
  await gameController.saveGame(req, res);
});

router.put("/update/:gameId", async (req: Request, res: Response) => {
  await gameController.updateGame(req, res);
});

router.get("/user/:userId", async (req: Request, res: Response) => {
  await gameController.getUserGames(req, res);
});

router.get("/total", async (req: Request, res: Response) => {
  await gameController.getTotalGames(req, res);
});

export default router;