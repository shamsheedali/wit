import express from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import AdminController from '../controllers/admin.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import isAdmin from '../../middleware/admin.middleware';
import asyncWrap from '../../middleware/asyncWrapper';

const router = express.Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

// ADMIN LOGIN
router.post('/login', asyncWrap(adminController.login.bind(adminController)));

// GET ALL USERS
router.get(
  '/users',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.getUsers.bind(adminController))
);

// TOGGLE_BAN-USER
router.patch(
  '/toggle-ban/:id',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.toggleBan.bind(adminController))
);

// GET ALL GAMES
router.get(
  '/games',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.getAllGames.bind(adminController))
);

// DELETE GAME
router.delete(
  '/games/:gameId',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.deleteGame.bind(adminController))
);

// TERMINATE GAME
router.patch(
  '/games/:gameId/terminate',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.terminateGame.bind(adminController))
);

// GET USER GROWTH
router.get(
  '/growth',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.getUserGrowth.bind(adminController))
);

// GET TOTAL USERS
router.get(
  '/total',
  authenticateToken,
  isAdmin(),
  asyncWrap(adminController.getTotalUsers.bind(adminController))
);

// REFRESH TOKEN
router.post('/refresh', asyncWrap(adminController.refreshToken.bind(adminController)));

export default router;
