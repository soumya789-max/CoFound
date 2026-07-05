import Message from '../models/Message.js';
import Listing from '../models/Listing.js';

// Helper: check if user is allowed to access a listing's chat
// Only the poster and accepted members may chat
const isMember = (listing, userId) => {
    const uid = userId.toString();
    return (
        listing.postedBy.toString() === uid ||
        listing.members.some(m => m.toString() === uid)
    );
};

// @desc    Get chat history for a listing's team chat
// @route   GET /api/messages/:listingId
// @access  Private (team members only)
export const getChatHistory = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.listingId);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (!isMember(listing, req.user._id)) {
            return res.status(403).json({ message: 'Only team members can access this chat' });
        }

        const messages = await Message.find({ listing: req.params.listingId })
            .populate('sender', 'name college')
            .sort({ createdAt: 1 })
            .limit(100); // last 100 messages

        res.json(messages);
    } catch (error) {
        console.error('Get chat history error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Post a new message to a listing's team chat (REST fallback; real-time via socket)
// @route   POST /api/messages/:listingId
// @access  Private (team members only)
export const sendMessage = async (req, res) => {
    const { text } = req.body;
    try {
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const listing = await Listing.findById(req.params.listingId);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (!isMember(listing, req.user._id)) {
            return res.status(403).json({ message: 'Only team members can post to this chat' });
        }

        const message = await Message.create({
            listing: req.params.listingId,
            sender: req.user._id,
            text: text.trim()
        });

        const populated = await Message.findById(message._id).populate('sender', 'name college');

        // Emit to the listing's socket room so all members receive in real-time
        const io = req.app.get('io');
        if (io) {
            io.to(`chat_${req.params.listingId}`).emit('new_message', populated);
        }

        res.status(201).json(populated);
    } catch (error) {
        console.error('Send message error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
