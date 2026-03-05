'use strict';

const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 30, unreadOnly } = req.query;
        const query = { userId: req.user._id };
        if (unreadOnly === 'true') query.isRead = false;

        const skip = (Number(page) - 1) * Number(limit);
        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId: req.user._id, isRead: false }),
        ]);
        res.json({ notifications, total, unreadCount });
    } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) { next(err); }
};

exports.deleteNotification = async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Notification deleted' });
    } catch (err) { next(err); }
};
