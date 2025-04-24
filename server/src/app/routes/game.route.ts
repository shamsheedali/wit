import express from 'express';
import container from '../../config/inversify.config';
import TYPES from '../../config/types';
import GameController from '../controllers/game.controller';
import asyncWrap from '../../middleware/asyncWrapper';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = express.Router();
const gameController = container.get<GameController>(TYPES.GameController);

router.post('/save', asyncWrap(gameController.saveGame.bind(gameController)));
router.put('/update/:gameId', asyncWrap(gameController.updateGame.bind(gameController)));
router.get(
  '/user/:userId',
  authenticateToken,
  asyncWrap(gameController.getUserGames.bind(gameController))
);
router.get('/total', asyncWrap(gameController.getTotalGames.bind(gameController)));
router.get(
  '/ongoing/:userId',
  asyncWrap(gameController.getOngoingGameByUserId.bind(gameController))
);

export default router;
