'use strict';
const Announcement = require('../../models/superadmin/Announcement');

exports.list = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
        res.json({ announcements });
    } catch { res.status(500).json({ error: 'Failed to fetch announcements' }); }
};

exports.listActive = async (req, res) => {
    try {
        const now = new Date();
        const announcements = await Announcement.find({
            isActive: true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        }).sort({ isPinned: -1, createdAt: -1 });
        res.json({ announcements });
    } catch { res.status(500).json({ error: 'Failed to fetch announcements' }); }
};

exports.create = async (req, res) => {
    try {
        const announcement = await Announcement.create({ ...req.body, createdBy: req.superAdmin._id });
        res.status(201).json({ announcement });
    } catch { res.status(500).json({ error: 'Failed to create announcement' }); }
};

exports.update = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
        res.json({ announcement });
    } catch { res.status(500).json({ error: 'Failed to update announcement' }); }
};

exports.remove = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete announcement' }); }
};
