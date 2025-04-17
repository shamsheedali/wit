import express from 'express';
import TYPES from '../../config/types';
import container from '../../config/inversify.config';
import MessageController from '../controllers/message.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import asyncWrap from '../../middleware/asyncWrapper';

const router = express.Router();
const messageController = container.get<MessageController>(TYPES.MessageController);

router.post(
  '/',
  authenticateToken,
  asyncWrap(messageController.sendMessage.bind(messageController))
);
router.get(
  '/:userId',
  authenticateToken,
  asyncWrap(messageController.getMessages.bind(messageController))
);

export default router;
