import express from 'express';
import { getChatHistory, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET  /api/messages/:listingId  — fetch chat history
// POST /api/messages/:listingId  — send a new message
router.route('/:listingId')
    .get(protect, getChatHistory)
    .post(protect, sendMessage);

export default router;
