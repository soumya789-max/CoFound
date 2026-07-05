import Request from '../models/Request.js';
import Listing from '../models/Listing.js';
import Notification from '../models/Notification.js';

// Helper to create and emit notification
const createAndSendNotification = async (req, userId, type, message, listingId) => {
    const notification = await Notification.create({
        userId,
        type,
        message,
        relatedListing: listingId,
        read: false
    });

    const populatedNotification = await Notification.findById(notification._id)
        .populate('relatedListing', 'title');

    const io = req.app.get('io');
    if (io) {
        // Emit to the user's private socket room
        io.to(userId.toString()).emit('new_notification', populatedNotification);
    }
    return populatedNotification;
};

// @desc    Send a request to join a project team
// @route   POST /api/requests
// @access  Private
export const sendJoinRequest = async (req, res) => {
    const { listingId } = req.body;

    try {
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ message: 'Project listing not found' });
        }

        // Rule 1: Cannot request own listing
        if (listing.postedBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot request to join your own project' });
        }

        // Rule 2: Cannot request if listing is closed or full
        if (listing.status === 'Closed' || listing.status === 'Team Full') {
            return res.status(400).json({ message: 'This team is already full or closed' });
        }

        // Rule 3: Cannot request if already in the members list
        if (listing.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'You are already a member of this team' });
        }

        // Rule 4: Cannot request if already has a pending or accepted request
        const existingRequest = await Request.findOne({
            listingId,
            requestedBy: req.user._id,
            status: { $in: ['Pending', 'Accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have an active request for this project' });
        }

        // Create the request
        const newRequest = await Request.create({
            listingId,
            requestedBy: req.user._id,
            status: 'Pending'
        });

        // Update listing status to 'Requested' if it was 'Open'
        if (listing.status === 'Open') {
            listing.status = 'Requested';
            await listing.save();
        }

        // Send real-time notification to project owner
        await createAndSendNotification(
            req,
            listing.postedBy,
            'NEW_REQUEST',
            `${req.user.name} requested to join your project "${listing.title}"`,
            listing._id
        );

        const populatedRequest = await Request.findById(newRequest._id)
            .populate('requestedBy', 'name college branch year skills')
            .populate('listingId', 'title status postedBy');

        res.status(201).json(populatedRequest);
    } catch (error) {
        console.error('Send join request error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cancel a join request (by requester)
// @route   PUT /api/requests/:id/cancel
// @access  Private
export const cancelJoinRequest = async (req, res) => {
    try {
        const joinRequest = await Request.findById(req.params.id);

        if (!joinRequest) {
            return res.status(404).json({ message: 'Join request not found' });
        }

        // Verify that requester is the one cancelling
        if (joinRequest.requestedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this request' });
        }

        if (joinRequest.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot cancel request. Status is already ${joinRequest.status}` });
        }

        joinRequest.status = 'Cancelled';
        await joinRequest.save();

        // Check if there are other active requests left, otherwise reset listing status
        const otherRequests = await Request.findOne({
            listingId: joinRequest.listingId,
            status: 'Pending'
        });

        const listing = await Listing.findById(joinRequest.listingId);
        if (listing && !otherRequests && listing.members.length === 0) {
            listing.status = 'Open';
            await listing.save();
        }

        res.json({ message: 'Request cancelled successfully', request: joinRequest });
    } catch (error) {
        console.error('Cancel request error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Accept or reject request (by listing owner)
// @route   PUT /api/requests/:id/decide
// @access  Private
export const decideJoinRequest = async (req, res) => {
    const { action } = req.body; // 'Accept' or 'Reject'

    if (!['Accept', 'Reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action. Must be Accept or Reject' });
    }

    try {
        const joinRequest = await Request.findById(req.params.id)
            .populate('requestedBy', 'name email');

        if (!joinRequest) {
            return res.status(404).json({ message: 'Join request not found' });
        }

        const listing = await Listing.findById(joinRequest.listingId);

        if (!listing) {
            return res.status(404).json({ message: 'Project listing not found' });
        }

        // Verify that the decider is the listing poster
        if (listing.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to handle requests for this project' });
        }

        if (joinRequest.status !== 'Pending') {
            return res.status(400).json({ message: 'This request has already been processed' });
        }

        if (action === 'Accept') {
            // Check if team is full
            const openSlots = listing.teamSize - 1 - listing.members.length; // Excluding poster
            if (openSlots <= 0) {
                return res.status(400).json({ message: 'Cannot accept request. Team is already full' });
            }

            // Accept requester into team members
            listing.members.push(joinRequest.requestedBy._id);
            joinRequest.status = 'Accepted';
            
            // Check if team becomes full now
            const newOpenSlots = listing.teamSize - 1 - listing.members.length;
            if (newOpenSlots <= 0) {
                listing.status = 'Team Full';
                
                // Auto-reject and notify all remaining pending requests for this listing
                const pendingRequests = await Request.find({
                    listingId: listing._id,
                    _id: { $ne: joinRequest._id },
                    status: 'Pending'
                });

                for (let reqObj of pendingRequests) {
                    reqObj.status = 'Rejected';
                    await reqObj.save();

                    // Send notification to auto-rejected users
                    await createAndSendNotification(
                        req,
                        reqObj.requestedBy,
                        'TEAM_FULL',
                        `The team for "${listing.title}" is full. Your pending request has been declined.`,
                        listing._id
                    );
                }
            } else {
                listing.status = 'Requested'; // There are still more slots, but requests have been made
            }

            await listing.save();
            await joinRequest.save();

            // Send notification to accepted user
            await createAndSendNotification(
                req,
                joinRequest.requestedBy._id,
                'REQUEST_ACCEPTED',
                `Congratulations! Your request to join "${listing.title}" was accepted!`,
                listing._id
            );
        } else {
            // Reject the request
            joinRequest.status = 'Rejected';
            await joinRequest.save();

            // Recalculate listing status if no more pending requests
            const activeRequests = await Request.findOne({
                listingId: listing._id,
                status: 'Pending'
            });

            if (!activeRequests && listing.members.length === 0) {
                listing.status = 'Open';
                await listing.save();
            }

            // Send notification to rejected user
            await createAndSendNotification(
                req,
                joinRequest.requestedBy._id,
                'REQUEST_REJECTED',
                `Your request to join "${listing.title}" was declined by the poster.`,
                listing._id
            );
        }

        res.json({ message: `Request successfully ${action}ed`, request: joinRequest });
    } catch (error) {
        console.error('Decide request error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get requests sent by the logged-in user
// @route   GET /api/requests/sent
// @access  Private
export const getMySentRequests = async (req, res) => {
    try {
        const requests = await Request.find({ requestedBy: req.user._id })
            .populate({
                path: 'listingId',
                select: 'title category status teamSize members postedBy',
                populate: {
                    path: 'postedBy',
                    select: 'name email college branch year'
                }
            })
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Fetch sent requests error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get incoming requests received by user (owner of listings)
// @route   GET /api/requests/incoming
// @access  Private
export const getIncomingRequests = async (req, res) => {
    try {
        // Find listings posted by the user
        const myListings = await Listing.find({ postedBy: req.user._id }).select('_id');
        const listingIds = myListings.map(l => l._id);

        const requests = await Request.find({
            listingId: { $in: listingIds }
        })
        .populate('requestedBy', 'name email college branch year skills')
        .populate('listingId', 'title status teamSize members')
        .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Fetch incoming requests error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
