'use strict';
const Subscription = require('../../models/superadmin/Subscription');

exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const [subscriptions, total] = await Promise.all([
            Subscription.find(filter).populate('companyId', 'companyName adminEmail').populate('planId', 'planName price').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Subscription.countDocuments(filter),
        ]);
        res.json({ subscriptions, total });
    } catch { res.status(500).json({ error: 'Failed to fetch subscriptions' }); }
};

exports.cancel = async (req, res) => {
    try {
        const sub = await Subscription.findByIdAndUpdate(req.params.id, { status: 'cancelled', cancelledAt: new Date(), cancelReason: req.body.reason || 'Cancelled by super admin' }, { new: true });
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ message: 'Subscription cancelled', subscription: sub });
    } catch { res.status(500).json({ error: 'Failed to cancel subscription' }); }
};

exports.forceRenew = async (req, res) => {
    try {
        const sub = await Subscription.findById(req.params.id).populate('planId');
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        const renewal = new Date();
        renewal.setMonth(renewal.getMonth() + (sub.planId?.billingCycle === 'yearly' ? 12 : 1));
        sub.status = 'active';
        sub.renewalDate = renewal;
        sub.paymentStatus = 'paid';
        sub.notes = `Force renewed by super admin on ${new Date().toISOString()}`;
        await sub.save();
        res.json({ message: 'Subscription renewed', subscription: sub });
    } catch { res.status(500).json({ error: 'Failed to renew subscription' }); }
};

exports.refund = async (req, res) => {
    try {
        const sub = await Subscription.findByIdAndUpdate(req.params.id, { paymentStatus: 'refunded', status: 'cancelled', notes: `Refunded by super admin: ${req.body.reason || ''}` }, { new: true });
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ message: 'Subscription marked as refunded', subscription: sub });
    } catch { res.status(500).json({ error: 'Failed to process refund' }); }
};
