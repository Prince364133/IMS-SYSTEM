'use strict';
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SupportTicket = require('../models/superadmin/SupportTicket');
const Company = require('../models/superadmin/Company');

// All company support routes require auth
router.use(protect);

// ── Create ticket (enforces 9/month limit) ────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        // Find the company record for this admin
        const company = await Company.findOne({ adminEmail: req.user.email });
        if (!company) {
            // Auto-register company record if not present
            // Still allow ticket creation with user info only
        }
        const companyId = company?._id || req.user._id;
        const count = await SupportTicket.getMonthlyCount(companyId);
        if (count >= SupportTicket.MONTHLY_LIMIT) {
            return res.status(429).json({
                error: `Monthly support ticket limit reached (${SupportTicket.MONTHLY_LIMIT}/month). Please wait until next month.`,
                used: count,
                limit: SupportTicket.MONTHLY_LIMIT,
            });
        }
        const ticket = await SupportTicket.create({
            companyId,
            companyName: company?.companyName || req.user.name,
            raisedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
            subject: req.body.subject,
            description: req.body.description,
            category: req.body.category || 'other',
            priority: req.body.priority || 'medium',
        });
        res.status(201).json({
            ticket,
            remaining: SupportTicket.MONTHLY_LIMIT - (count + 1),
            used: count + 1,
            limit: SupportTicket.MONTHLY_LIMIT,
        });
    } catch (err) {
        console.error('Create ticket error:', err);
        res.status(500).json({ error: 'Failed to create support ticket' });
    }
});

// ── List own tickets ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const company = await Company.findOne({ adminEmail: req.user.email });
        const companyId = company?._id || req.user._id;
        const tickets = await SupportTicket.find({ companyId }).sort({ createdAt: -1 });
        // Also get monthly usage
        const monthCount = await SupportTicket.getMonthlyCount(companyId);
        res.json({ tickets, monthlyUsed: monthCount, monthlyLimit: SupportTicket.MONTHLY_LIMIT });
    } catch { res.status(500).json({ error: 'Failed to fetch tickets' }); }
});

// ── Get one ticket ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json({ ticket });
    } catch { res.status(500).json({ error: 'Failed to fetch ticket' }); }
});

// ── Add reply from company side ────────────────────────────────────────────────
router.post('/:id/reply', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {
            $push: { messages: { senderName: req.user.name, senderRole: 'admin', senderId: req.user._id, text } },
            status: 'waiting_on_customer',
        }, { new: true });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json({ ticket });
    } catch { res.status(500).json({ error: 'Failed to add reply' }); }
});

module.exports = router;
