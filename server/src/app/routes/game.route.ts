import express, { Request, Response } from "express";
import container from "../../config/inversify.config";
import TYPES from "../../config/types";
import GameController from "../controllers/game.controller";

const router = express.Router();
const gameController = container.get<GameController>(TYPES.GameController);

router.post("/save", async (req: Request, res: Response) => {
    await gameController.saveGame(req, res);
});
router.get("/user/:userId", async (req: Request, res: Response) => {
    await gameController.getUserGames(req, res);
});

export default router;