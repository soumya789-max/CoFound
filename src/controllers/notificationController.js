import Notification from '../models/Notification.js';

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .populate('relatedListing', 'title')
            .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark read error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markSingleNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this notification' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error('Mark single read error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a single notification permanently
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this notification' });
        }

        await notification.deleteOne();
        res.json({ message: 'Notification deleted permanently' });
    } catch (error) {
        console.error('Delete notification error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

