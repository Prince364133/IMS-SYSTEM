'use strict';
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../../models/superadmin/SuperAdmin');

const signToken = (admin) => jwt.sign(
    { id: admin._id, role: 'superadmin', email: admin.email },
    process.env.SUPER_ADMIN_JWT_SECRET,
    { expiresIn: process.env.SUPER_ADMIN_JWT_EXPIRES_IN || '8h' }
);

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const admin = await SuperAdmin.findOne({ email: email.toLowerCase() });
        if (!admin || !admin.isActive) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await admin.comparePassword(password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        admin.lastLogin = new Date();
        await admin.save();
        const token = signToken(admin);
        res.json({ token, superAdmin: admin.toSafeObject() });
    } catch (err) {
        console.error('SA login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.getMe = async (req, res) => {
    res.json({ superAdmin: req.superAdmin });
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const existingEmail = await SuperAdmin.findOne({ email: email.toLowerCase(), _id: { $ne: req.superAdmin._id } });
        if (existingEmail) return res.status(400).json({ error: 'Email already in use' });

        const admin = await SuperAdmin.findById(req.superAdmin._id);
        if (name) admin.name = name;
        admin.email = email.toLowerCase();
        await admin.save();

        res.json({ message: 'Profile updated successfully', superAdmin: admin.toSafeObject() });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
        const admin = await SuperAdmin.findById(req.superAdmin._id);
        const valid = await admin.comparePassword(currentPassword);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        admin.passwordHash = newPassword; // pre-save hook hashes it
        await admin.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to change password' });
    }
};

exports.logout = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};
