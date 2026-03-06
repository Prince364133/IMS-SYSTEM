'use strict';
const User = require('../../models/User');
const Company = require('../../models/superadmin/Company');

exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 30, search = '', role } = req.query;
        const filter = {};
        if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        if (role) filter.role = role;
        const [users, total] = await Promise.all([
            User.find(filter).select('-password -refreshTokens').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            User.countDocuments(filter),
        ]);
        res.json({ users, total });
    } catch { res.status(500).json({ error: 'Failed to list users' }); }
};

exports.suspend = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'User suspended' });
    } catch { res.status(500).json({ error: 'Failed to suspend user' }); }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete user' }); }
};
