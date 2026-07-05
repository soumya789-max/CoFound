import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Expired'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate join requests from the same user to the same listing
requestSchema.index({ listingId: 1, requestedBy: 1 }, { unique: true });

const Request = mongoose.model('Request', requestSchema);
export default Request;
