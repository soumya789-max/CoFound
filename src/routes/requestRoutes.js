import express from 'express';
import { sendJoinRequest, cancelJoinRequest, decideJoinRequest, getMySentRequests, getIncomingRequests } from '../controllers/requestController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, sendJoinRequest);

router.get('/sent', protect, getMySentRequests);
router.get('/incoming', protect, getIncomingRequests);

router.delete('/:id/cancel', protect, cancelJoinRequest);
router.put('/:id/decide', protect, decideJoinRequest);

export default router;
