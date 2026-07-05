import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendOTPEmail } from '../utils/email.js';

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_cofound_key_2026', {
        expiresIn: '30d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, college, branch, year, skills } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            college,
            branch,
            year,
            skills: skills || []
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                college: user.college,
                branch: user.branch,
                year: user.year,
                skills: user.skills,
                bio: user.bio,
                isVerified: user.isVerified,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                college: user.college,
                branch: user.branch,
                year: user.year,
                skills: user.skills,
                bio: user.bio,
                isVerified: user.isVerified,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile fetch error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile (specifically skills and academic details)
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.college = req.body.college || user.college;
            user.branch = req.body.branch || user.branch;
            user.year = req.body.year || user.year;
            user.skills = req.body.skills || user.skills;
            if (req.body.bio !== undefined) user.bio = req.body.bio;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                college: updatedUser.college,
                branch: updatedUser.branch,
                year: updatedUser.year,
                skills: updatedUser.skills,
                bio: updatedUser.bio,
                isVerified: updatedUser.isVerified,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get another user's public profile
// @route   GET /api/auth/users/:id
// @access  Private
export const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Public profile fetch error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Send OTP to the logged-in user's email
// @route   POST /api/auth/send-otp
// @access  Private
export const sendOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

        // Generate a 6-digit numeric OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTPEmail(user.email, otp, user.name);

        res.json({ message: 'OTP sent to your registered email address' });
    } catch (error) {
        console.error('Send OTP error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify OTP submitted by the user
// @route   POST /api/auth/verify-otp
// @access  Private
export const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    try {
        if (!otp) return res.status(400).json({ message: 'OTP is required' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

        if (!user.otp || user.otp !== otp.toString()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpires < new Date()) {
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Mark as verified and clear OTP
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: 'Email verified successfully!', isVerified: true });
    } catch (error) {
        console.error('Verify OTP error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
