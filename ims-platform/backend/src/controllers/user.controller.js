'use strict';

const User = require('../models/User');
const { logAction } = require('../middleware/audit');
const { deleteFromCloudinary } = require('../config/cloudinary');

exports.getUsers = async (req, res, next) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        const query = {};
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } },
        ];
        if (role) query.role = role;

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
            User.countDocuments(query),
        ]);

        res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) { next(err); }
};

exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Only admin can change roles; employees can only update their own profile
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const forbidden = ['password', 'email', 'refreshTokens', 'mfaSecret'];
        if (req.user.role !== 'admin') forbidden.push('role', 'salary', 'employeeId');
        forbidden.forEach((f) => delete req.body[f]);

        const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });

        await logAction(req.user._id, 'UPDATE_USER', 'user', id, {}, req);
        res.json({ user });
    } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await User.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false });
        await logAction(req.user._id, 'DELETE_USER', 'user', id, {}, req);
        res.json({ message: 'User deleted successfully' });
    } catch (err) { next(err); }
};

exports.updatePhoto = async (req, res, next) => {
    try {
        if (!req.cloudinaryResult) {
            return res.status(400).json({ error: 'Photo upload failed' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { photoUrl: req.cloudinaryResult.secure_url },
            { new: true }
        ).lean();
        res.json({ user, photoUrl: req.cloudinaryResult.secure_url });
    } catch (err) { next(err); }
};
