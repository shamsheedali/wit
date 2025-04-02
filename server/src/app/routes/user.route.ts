import express from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import UserController from '../controllers/user.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import upload from '../../middleware/upload.middleware';
import asyncWrap from '../../middleware/asyncWrapper';

const router = express.Router();
const userController = container.get<UserController>(TYPES.UserController);

router.post('/register', asyncWrap(userController.registerUser.bind(userController)));
router.post('/login', asyncWrap(userController.login.bind(userController)));
router.get('/username/verify', asyncWrap(userController.checkUsername.bind(userController)));
router.post('/google-auth', asyncWrap(userController.googleUser.bind(userController)));
router.post('/verify-password', asyncWrap(userController.verifyPassword.bind(userController)));
router.post('/forgot-password', asyncWrap(userController.forgotPassword.bind(userController)));
router.post('/reset-password', asyncWrap(userController.resetPassword.bind(userController)));
router.post('/otp', asyncWrap(userController.sendOtp.bind(userController)));
router.post('/verify-otp', asyncWrap(userController.verifyOtp.bind(userController)));
router.get('/search', asyncWrap(userController.searchUser.bind(userController)));
router.get('/username/:username', asyncWrap(userController.getUser.bind(userController)));
router.put(
  '/profile/:id',
  upload.single('profileImage'),
  asyncWrap(userController.updateProfile.bind(userController))
);
router.get(
  '/growth',
  authenticateToken,
  asyncWrap(userController.getUserGrowth.bind(userController))
);
router.get(
  '/total',
  authenticateToken,
  asyncWrap(userController.getTotalUsers.bind(userController))
);

export default router;
