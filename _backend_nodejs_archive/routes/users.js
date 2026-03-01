const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { role, search } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const users = await User.find(filter).select('-password').sort({ name: 1 });
        res.json({ users, count: users.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/users/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/users/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        // Only admin or the user themselves can update
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this user' });
        }

        const allowedFields = ['name', 'phone', 'department', 'position', 'photoUrl'];
        const updates = {};
        allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        // Admin can also update role and isActive
        if (req.user.role === 'admin') {
            if (req.body.role) updates.role = req.body.role;
            if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/users/:id (admin only) ──────────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
