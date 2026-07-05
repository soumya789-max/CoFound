import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Hackathon', 'College Project', 'Startup Idea', 'College Event']
    },
    skillsNeeded: {
        type: [String],
        default: []
    },
    teamSize: {
        type: Number,
        required: true,
        min: 2
    },
    deadline: {
        type: Date,
        required: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'Requested', 'Team Full', 'Closed'],
        default: 'Open'
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create MongoDB TTL index on the deadline field so expired documents are automatically deleted
listingSchema.index({ deadline: 1 }, { expireAfterSeconds: 0 });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
