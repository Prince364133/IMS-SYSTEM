'use strict';
const SupportTicket = require('../../models/superadmin/SupportTicket');

exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            SupportTicket.countDocuments(filter),
        ]);
        res.json({ tickets, total });
    } catch { res.status(500).json({ error: 'Failed to fetch tickets' }); }
};

exports.getOne = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json({ ticket });
    } catch { res.status(500).json({ error: 'Failed to get ticket' }); }
};

exports.reply = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ error: 'Message text is required' });
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {
            $push: { messages: { senderName: req.superAdmin.name, senderRole: 'superadmin', senderId: req.superAdmin._id, text } },
            status: 'in_progress',
        }, { new: true });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json({ ticket });
    } catch { res.status(500).json({ error: 'Failed to send reply' }); }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const update = { status };
        if (status === 'resolved') update.resolvedAt = new Date();
        if (status === 'closed') update.closedAt = new Date();
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json({ ticket });
    } catch { res.status(500).json({ error: 'Failed to update status' }); }
};
