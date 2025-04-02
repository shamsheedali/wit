import express, { Request, Response } from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import ClubController from '../controllers/club.controller';

const router = express.Router();
const clubController = container.get<ClubController>(TYPES.ClubController);

// Create a club
router.post('/create', async (req: Request, res: Response) => {
  await clubController.createClub(req, res);
});

// Join a club
router.post('/join', async (req: Request, res: Response) => {
  await clubController.joinClub(req, res);
});

// Get all public clubs
router.get('/public', async (req: Request, res: Response) => {
  await clubController.getPublicClubs(req, res);
});

router.get('/user-clubs', async (req: Request, res: Response) => {
  await clubController.getUserClubs(req, res);
});

export default router;
