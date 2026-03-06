'use strict';
const Company = require('../../models/superadmin/Company');
const Subscription = require('../../models/superadmin/Subscription');
const User = require('../../models/User');

exports.getOverview = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalCompanies,
            activeCompanies,
            newCompaniesThisMonth,
            totalSubscriptions,
            activeSubscriptions,
            failedPayments,
        ] = await Promise.all([
            Company.countDocuments(),
            Company.countDocuments({ isSuspended: false, subscriptionStatus: 'active' }),
            Company.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Subscription.countDocuments(),
            Subscription.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ paymentStatus: 'failed' }),
        ]);

        // Monthly revenue (sum of paid subscriptions this month)
        const revenueAgg = await Subscription.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const monthlyRevenue = revenueAgg[0]?.total || 0;

        // Revenue last 6 months
        const revenueChart = await Subscription.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$amount' } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Company growth last 6 months
        const companyChart = await Company.aggregate([
            { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Plan distribution (pie chart)
        const planDist = await Subscription.aggregate([
            { $match: { status: 'active' } },
            { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
            { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$plan.planName', count: { $sum: 1 } } },
        ]);

        // Total users across platform (from main User collection)
        let totalUsers = 0;
        try { totalUsers = await User.countDocuments(); } catch { }

        res.json({
            stats: {
                totalCompanies, activeCompanies, newCompaniesThisMonth,
                totalSubscriptions, activeSubscriptions, failedPayments,
                monthlyRevenue, totalUsers,
            },
            charts: { revenueChart, companyChart, planDist },
        });
    } catch (err) {
        console.error('Overview error:', err);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
};
