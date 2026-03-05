'use strict';
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const Invoice = require('../models/Invoice');

// GET /api/invoices
router.get('/', protect, async (req, res, next) => {
    try {
        const { status, clientId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (clientId) filter.clientId = clientId;
        const invoices = await Invoice.find(filter)
            .populate('clientId', 'name email company')
            .populate('createdBy', 'name')
            .sort({ issueDate: -1 }).lean();
        const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
        res.json({ invoices, totalRevenue });
    } catch (err) { next(err); }
});

// GET /api/invoices/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('clientId', 'name email company phone address')
            .populate('createdBy', 'name').lean();
        if (!invoice) return res.status(404).json({ error: 'Not found' });
        res.json({ invoice });
    } catch (err) { next(err); }
});

// POST /api/invoices
router.post('/', protect, async (req, res, next) => {
    try {
        const { lineItems = [], taxPercent = 0, discount = 0, ...rest } = req.body;
        const subtotal = lineItems.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
        const totalAmount = subtotal - discount + (subtotal * taxPercent / 100);
        const invoice = await Invoice.create({
            ...rest,
            lineItems: lineItems.map(item => ({ ...item, amount: item.quantity * item.unitPrice })),
            subtotal,
            taxPercent,
            discount,
            totalAmount,
            createdBy: req.user._id,
        });
        res.status(201).json({ invoice });
    } catch (err) { next(err); }
});

// PUT /api/invoices/:id
router.put('/:id', protect, async (req, res, next) => {
    try {
        const { lineItems = [], taxPercent = 0, discount = 0, ...rest } = req.body;
        const subtotal = lineItems.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
        const totalAmount = subtotal - discount + (subtotal * taxPercent / 100);
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { ...rest, lineItems: lineItems.map(item => ({ ...item, amount: item.quantity * item.unitPrice })), subtotal, taxPercent, discount, totalAmount },
            { new: true }
        ).lean();
        if (!invoice) return res.status(404).json({ error: 'Not found' });
        res.json({ invoice });
    } catch (err) { next(err); }
});

// DELETE /api/invoices/:id
router.delete('/:id', protect, requireAdmin, async (req, res, next) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
