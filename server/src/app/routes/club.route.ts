import express, { Request, Response } from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import ClubController from '../controllers/club.controller';
import asyncWrap from '../../middleware/asyncWrapper';

const router = express.Router();
const clubController = container.get<ClubController>(TYPES.ClubController);

// Create a club
router.post('/create', asyncWrap(clubController.createClub.bind(clubController)));

// Join a club
router.post('/join', asyncWrap(clubController.joinClub.bind(clubController)));

// Get all public clubs
router.get('/public', asyncWrap(clubController.getPublicClubs.bind(clubController)));

router.get('/user-clubs', asyncWrap(clubController.getUserClubs.bind(clubController)));

export default router;
