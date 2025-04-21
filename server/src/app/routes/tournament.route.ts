import express from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import TournamentController from '../controllers/tournament.controller';
import asyncWrap from '../../middleware/asyncWrapper';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = express.Router();
const tournamentController = container.get<TournamentController>(TYPES.TournamentController);

router.post(
  '/create',
  authenticateToken,
  asyncWrap(tournamentController.createTournament.bind(tournamentController))
);
router.post(
  '/join',
  authenticateToken,
  asyncWrap(tournamentController.joinTournament.bind(tournamentController))
);
router.post(
  '/start',
  authenticateToken,
  asyncWrap(tournamentController.startTournament.bind(tournamentController))
);
router.post(
  '/leave',
  authenticateToken,
  asyncWrap(tournamentController.leaveTournament.bind(tournamentController))
);
router.post(
  '/delete',
  authenticateToken,
  asyncWrap(tournamentController.deleteTournament.bind(tournamentController))
);
router.get('/', asyncWrap(tournamentController.getTournaments.bind(tournamentController)));
router.get(
  '/user',
  authenticateToken,
  asyncWrap(tournamentController.getUserTournaments.bind(tournamentController))
);
router.get(
  '/:tournamentId',
  asyncWrap(tournamentController.getTournament.bind(tournamentController))
);
router.post(
  '/result',
  authenticateToken,
  asyncWrap(tournamentController.submitResult.bind(tournamentController))
);
router.post(
  '/playoff-result',
  authenticateToken,
  asyncWrap(tournamentController.submitPlayoffResult.bind(tournamentController))
);
router.post(
  '/pair',
  authenticateToken,
  asyncWrap(tournamentController.pairMatch.bind(tournamentController))
);

export default router;
