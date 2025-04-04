// admin.routes.ts
import express, { Request, Response } from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import AdminController from '../controllers/admin.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import isAdmin from '../../middleware/admin.middleware';

const router = express.Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

// ADMIN LOGIN
router.post('/login', async (req: Request, res: Response) => {
  await adminController.login(req, res);
});

// GET ALL USERS
router.get('/users', authenticateToken, isAdmin(), async (req: Request, res: Response) => {
  await adminController.getUsers(req, res);
});

// TOGGLE_BAN-USER
router.patch(
  '/toggle-ban/:id',
  authenticateToken,
  isAdmin(),
  async (req: Request, res: Response) => {
    await adminController.toggleBan(req, res);
  }
);

//GET ALL GAMES
router.get('/games', authenticateToken, isAdmin(), async (req: Request, res: Response) => {
  await adminController.getAllGames(req, res);
});

//DELETE GAME
router.delete(
  '/games/:gameId',
  authenticateToken,
  isAdmin(),
  async (req: Request, res: Response) => {
    await adminController.deleteGame(req, res);
  }
);

//TERMINATE GAME
router.patch(
  '/games/:gameId/terminate',
  authenticateToken,
  isAdmin(),
  async (req: Request, res: Response) => {
    await adminController.terminateGame(req, res);
  }
);

router.get('/growth', authenticateToken, isAdmin(), async (req: Request, res: Response) => {
  await adminController.getUserGrowth(req, res);
});

router.get('/total', authenticateToken, isAdmin(), async (req: Request, res: Response) => {
  await adminController.getTotalUsers(req, res);
});

router.post('/refresh', async (req: Request, res: Response) => {
  await adminController.refreshToken(req, res);
});

export default router;
