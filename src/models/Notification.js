import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['NEW_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'TEAM_FULL']
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false,
        required: true
    },
    relatedListing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
