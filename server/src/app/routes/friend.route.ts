import express from 'express';
import container from '../../config/inversify.config';
import TYPES from '../../config/types';
import FriendController from '../controllers/friend.controller';
import asyncWrap from '../../middleware/asyncWrapper';

const router = express.Router();
const friendController = container.get<FriendController>(TYPES.FriendController);

router.get('/friends', asyncWrap(friendController.getFriends.bind(friendController)));
router.post('/request', asyncWrap(friendController.sendFriendRequest.bind(friendController)));
router.get('/requests', asyncWrap(friendController.getFriendRequests.bind(friendController)));
router.patch(
  '/request/:requestId',
  asyncWrap(friendController.updateFriendRequest.bind(friendController))
);
router.delete('/friend', asyncWrap(friendController.removeFriend.bind(friendController)));

export default router;
