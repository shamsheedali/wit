import express from 'express';
import container from '../../config/inversify.config';
import TYPES from '../../config/types';
import FriendController from '../controllers/friend.controller';

const router = express.Router();
const friendController = container.get<FriendController>(TYPES.FriendController);

router.get('/friends', friendController.getFriends.bind(friendController));
router.post('/request', friendController.sendFriendRequest.bind(friendController));
router.get('/requests', friendController.getFriendRequests.bind(friendController));
router.patch('/request/:requestId', friendController.updateFriendRequest.bind(friendController));

export default router;