import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, getPublicProfile, sendOTP, verifyOTP } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);
router.get('/users/:id', protect, getPublicProfile);
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

export default router;
