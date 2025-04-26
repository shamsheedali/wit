import express from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import GameReportController from '../controllers/gameReport.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import asyncWrap from '../../middleware/asyncWrapper';

const router = express.Router();
const gameReportController = container.get<GameReportController>(TYPES.GameReportController);

router.post(
  '/',
  authenticateToken,
  asyncWrap(gameReportController.createReport.bind(gameReportController))
);

export default router;
