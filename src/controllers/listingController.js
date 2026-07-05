import Listing from '../models/Listing.js';

// @desc    Create new project listing
// @route   POST /api/listings
// @access  Private
export const createListing = async (req, res) => {
    const { title, description, category, skillsNeeded, teamSize, deadline } = req.body;

    try {
        if (!title || !description || !category || !teamSize || !deadline) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return res.status(400).json({ message: 'Deadline must be a future date' });
        }

        const listing = await Listing.create({
            title,
            description,
            category,
            skillsNeeded: skillsNeeded || [],
            teamSize,
            deadline: deadlineDate,
            postedBy: req.user._id,
            status: 'Open'
        });

        const populatedListing = await Listing.findById(listing._id)
            .populate('postedBy', 'name college branch year skills')
            .populate('members', 'name college branch year skills');

        res.status(201).json(populatedListing);
    } catch (error) {
        console.error('Create listing error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all listings with search and filters
// @route   GET /api/listings
// @access  Private
export const getListings = async (req, res) => {
    const { category, skill, search } = req.query;
    let query = {};

    // Don't show listings whose deadline has already passed (even if TTL index hasn't deleted them yet)
    query.deadline = { $gt: new Date() };

    // Apply category filter
    if (category && category !== 'All') {
        query.category = category;
    }

    // Apply skill filter
    if (skill) {
        // Find listings that require this skill (case insensitive)
        query.skillsNeeded = { $in: [new RegExp(`^${skill}$`, 'i')] };
    }

    // Apply search query
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const listings = await Listing.find(query)
            .populate('postedBy', 'name college branch year skills')
            .populate('members', 'name college branch year skills')
            .sort({ createdAt: -1 });

        res.json(listings);
    } catch (error) {
        console.error('Fetch listings error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single listing by ID
// @route   GET /api/listings/:id
// @access  Private
export const getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('postedBy', 'name college branch year skills')
            .populate('members', 'name college branch year skills');

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json(listing);
    } catch (error) {
        console.error('Fetch single listing error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private
export const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Verify ownership
        if (listing.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to delete this listing' });
        }

        await listing.deleteOne();
        res.json({ message: 'Listing removed successfully' });
    } catch (error) {
        console.error('Delete listing error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private
export const updateListing = async (req, res) => {
    const { title, description, category, skillsNeeded, teamSize, deadline } = req.body;

    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Verify ownership
        if (listing.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this listing' });
        }

        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (deadlineDate <= new Date()) {
                return res.status(400).json({ message: 'Deadline must be a future date' });
            }
            listing.deadline = deadlineDate;
        }

        listing.title = title || listing.title;
        listing.description = description || listing.description;
        listing.category = category || listing.category;
        listing.skillsNeeded = skillsNeeded || listing.skillsNeeded;
        listing.teamSize = teamSize || listing.teamSize;

        // Recalculate status based on team size vs current members
        // poster + members = members.length + 1
        const totalTeamMembersCount = listing.members.length + 1;
        if (totalTeamMembersCount >= listing.teamSize) {
            listing.status = 'Team Full';
        } else {
            listing.status = 'Open';
        }

        const updatedListing = await listing.save();
        
        const populatedListing = await Listing.findById(updatedListing._id)
            .populate('postedBy', 'name college branch year skills')
            .populate('members', 'name college branch year skills');

        res.json(populatedListing);
    } catch (error) {
        console.error('Update listing error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all listings posted by the logged-in user
// @route   GET /api/listings/my
// @access  Private
export const getMyListings = async (req, res) => {
    try {
        const listings = await Listing.find({ postedBy: req.user._id })
            .populate('postedBy', 'name college branch year skills')
            .populate('members', 'name college branch year skills')
            .sort({ createdAt: -1 });

        res.json(listings);
    } catch (error) {
        console.error('Fetch my listings error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get skill-based recommended listings for the logged-in user
// @route   GET /api/listings/recommendations
// @access  Private
export const getRecommendations = async (req, res) => {
    try {
        const userSkills = (req.user.skills || []).map(s => s.toLowerCase());

        // Fetch open listings not posted by the user, within deadline
        const listings = await Listing.find({
            postedBy: { $ne: req.user._id },
            status: 'Open',
            deadline: { $gt: new Date() }
        })
            .populate('postedBy', 'name college branch year skills')
            .populate('members', 'name college branch year skills')
            .lean();

        if (userSkills.length === 0) {
            // No skills set — return newest open listings (up to 10)
            const topListings = listings
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);
            return res.json(topListings);
        }

        // Score each listing by how many skills overlap with the user's skills
        const scored = listings.map(listing => {
            const needed = (listing.skillsNeeded || []).map(s => s.toLowerCase());
            const overlap = needed.filter(s => userSkills.includes(s)).length;
            return { ...listing, _score: overlap };
        });

        // Sort by score descending, then by newest, take top 10
        scored.sort((a, b) => b._score - a._score || new Date(b.createdAt) - new Date(a.createdAt));

        const top = scored.slice(0, 10).map(({ _score, ...rest }) => rest);
        res.json(top);
    } catch (error) {
        console.error('Recommendations error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
