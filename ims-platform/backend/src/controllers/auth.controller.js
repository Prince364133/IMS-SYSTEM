'use strict';

const User = require('../models/User');
const { logAction } = require('../middleware/audit');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');
const { totp } = require('otplib');
const qrcode = require('qrcode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');
const BillingService = require('../services/billing.service');
const EmailService = require('../services/email.service');

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, roles } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        // Check if ANY admin exists
        const adminExists = await User.exists({ roles: 'admin' });

        // Multi-role handling
        let safeRoles = (roles && Array.isArray(roles)) ? roles : [(role || 'employee')];

        // Validation & Normalization
        const validRoles = ['admin', 'manager', 'hr', 'employee', 'client'];
        safeRoles = [...new Set(safeRoles.filter(r => validRoles.includes(r)))];
        if (safeRoles.length === 0) safeRoles = ['employee'];

        // Security check
        const isGrantingHigherPrivilage = safeRoles.some(r => ['admin', 'hr'].includes(r));

        if (!adminExists) {
            // First user is ALWAYS admin if no admin exists in the system
            safeRoles = ['admin'];
        } else if (isGrantingHigherPrivilage && req.user?.role !== 'admin') {
            // Only logged-in admin can grant admin/hr to others
            // If not logged in as admin (e.g. public signup), force to employee
            safeRoles = ['employee'];
        }

        // Auto-generate employeeId if it's an employee/manager/hr and not provided
        let employeeId = req.body.employeeId;
        if (!employeeId && safeRoles.some(r => ['employee', 'manager', 'hr'].includes(r))) {
            const count = await User.countDocuments();
            employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
        }

        // Enforce user limit if not the first admin
        if (adminExists) {
            const limitCheck = await BillingService.enforceUserLimit();
            if (!limitCheck.allowed) {
                return res.status(403).json({
                    error: `User limit reached for your ${limitCheck.plan} plan (${limitCheck.current}/${limitCheck.max}). Please upgrade.`,
                    limitReached: true
                });
            }
        }

        const user = await User.create({ name, email, password, roles: safeRoles, employeeId });
        const token = signAccessToken(user._id);
        const refreshToken = signRefreshToken(user._id);

        // Notify via Automation Service
        const AutomationService = require('../services/automation.service');
        await AutomationService.trigger({
            eventType: 'user_onboarded',
            triggeredBy: req.user?._id || user._id, // If admin created, use admin, else self
            targetUser: user._id,
            relatedItem: { itemId: user._id, itemModel: 'User' },
            description: `Welcome to the team, ${user.name}! Your account is ready.`,
            metadata: { password } // Send temporary password for email template
        });

        if (req.user) {
            const Notification = require('../models/Notification');
            const { getIo } = require('../sockets');
            const settings = await Settings.findOne();
            const companyName = settings?.companyName || 'Internal Management System';
            const subject = encodeURIComponent(`Welcome to ${companyName}`);
            const body = encodeURIComponent(`Hi ${user.name},\n\nYour account has been created.\nEmail: ${user.email}\nPassword: ${password}\n\nLogin at: ${process.env.CLIENT_URL}`);
            const actionUrl = `mailto:${user.email}?subject=${subject}&body=${body}`;

            const notification = await Notification.create({
                userId: req.user._id,
                type: 'email_pending',
                title: 'Send Welcome Email',
                message: `New user ${user.name} created. Click to send their credentials.`,
                actionUrl,
            });
            const io = getIo();
            if (io) {
                io.to(req.user._id.toString()).emit('notification:new', {
                    _id: notification._id.toString(),
                    type: 'email_pending',
                    title: 'Send Welcome Email',
                    message: `New user ${user.name} created. Click to send their credentials.`,
                    actionUrl,
                    isRead: false,
                    createdAt: notification.createdAt
                });
            }
        }

        // ── Trial subscription + welcome email for first admin ──────────────
        if (!adminExists && safeRoles.includes('admin')) {
            try {
                const PlatformSettings = require('../models/superadmin/PlatformSettings');
                const ps = await PlatformSettings.getInstance();
                const trialResult = await BillingService.createTrialSubscription();
                await EmailService.sendTrialStartedEmail(user.email, user.name, trialResult.trialDays || ps.trialDays || 14);
            } catch (billingErr) {
                console.error('[Auth] Trial creation error (non-fatal):', billingErr.message);
            }
        }

        await logAction(user._id, 'REGISTER', 'user', user._id, {}, req);
        res.status(201).json({ token, refreshToken, user: sanitizeUser(user) });
    } catch (err) { next(err); }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { email, password, mfaToken } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+password +mfaSecret +mfaEnabled +refreshTokens');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account deactivated. Contact admin.' });
        }

        // MFA check
        if (user.mfaEnabled) {
            if (!mfaToken) {
                return res.status(200).json({ mfaRequired: true, userId: user._id });
            }
            const valid = totp.check(mfaToken, user.mfaSecret);
            if (!valid) return res.status(401).json({ error: 'Invalid MFA token' });
        }

        const accessToken = signAccessToken(user._id);
        const refreshToken = signRefreshToken(user._id);

        // Store refresh token hashed
        const hashed = await bcrypt.hash(refreshToken, 8);
        user.refreshTokens = [...(user.refreshTokens || []).slice(-4), hashed]; // keep last 5
        await user.save({ validateBeforeSave: false });

        await logAction(user._id, 'LOGIN', 'user', user._id, {}, req);
        res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
    } catch (err) { next(err); }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken && req.user) {
            const user = await User.findById(req.user._id).select('+refreshTokens');
            if (user) {
                // Remove matching refresh token
                const checked = await Promise.all(
                    (user.refreshTokens || []).map(async (h) => {
                        const match = await bcrypt.compare(refreshToken, h);
                        return match ? null : h;
                    })
                );
                user.refreshTokens = checked.filter(Boolean);
                await user.save({ validateBeforeSave: false });
            }
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err) { next(err); }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(decoded.id).select('+refreshTokens');
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Validate stored tokens
        const isValid = await Promise.any(
            (user.refreshTokens || []).map((h) => bcrypt.compare(refreshToken, h))
        ).catch(() => false);

        if (!isValid) return res.status(401).json({ error: 'Refresh token not recognized' });

        const newAccessToken = signAccessToken(user._id);
        res.json({ token: newAccessToken });
    } catch (err) { next(err); }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    res.json({ user: sanitizeUser(req.user) });
};

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both current and new password are required' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const ok = await user.matchPassword(currentPassword);
        if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

        user.password = newPassword;
        await user.save();

        await logAction(user._id, 'CHANGE_PASSWORD', 'user', user._id, {}, req);
        res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
};

// ─── MFA Setup ────────────────────────────────────────────────────────────────
exports.setupMFA = async (req, res, next) => {
    try {
        const settings = await Settings.findOne();
        const companyName = settings?.companyName || 'Internal Management System';
        const secret = totp.generateSecret();
        const uri = totp.keyuri(req.user.email, companyName, secret);
        const qrCode = await qrcode.toDataURL(uri);
        res.json({ secret, qrCode, provisioningUri: uri });
    } catch (err) { next(err); }
};

// ─── MFA Enable ───────────────────────────────────────────────────────────────
exports.enableMFA = async (req, res, next) => {
    try {
        const { secret, token } = req.body;
        if (!totp.check(token, secret)) {
            return res.status(400).json({ error: 'Invalid MFA token' });
        }
        await User.findByIdAndUpdate(req.user._id, { mfaEnabled: true, mfaSecret: secret });
        await logAction(req.user._id, 'MFA_ENABLED', 'user', req.user._id, {}, req);
        res.json({ message: 'MFA enabled successfully' });
    } catch (err) { next(err); }
};

// ─── MFA Verify (during login) ────────────────────────────────────────────────
exports.verifyMFA = async (req, res, next) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findById(userId).select('+mfaSecret +refreshTokens');
        if (!user || !user.mfaEnabled) {
            return res.status(400).json({ error: 'MFA not configured for this user' });
        }

        const valid = totp.check(token, user.mfaSecret);
        if (!valid) return res.status(401).json({ error: 'Invalid MFA token' });

        const accessToken = signAccessToken(user._id);
        const refreshToken = signRefreshToken(user._id);

        const hashed = await bcrypt.hash(refreshToken, 8);
        user.refreshTokens = [...(user.refreshTokens || []).slice(-4), hashed];
        await user.save({ validateBeforeSave: false });

        res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
    } catch (err) { next(err); }
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function sanitizeUser(user) {
    const u = user.toObject ? user.toObject() : { ...user };
    delete u.password;
    delete u.mfaSecret;
    delete u.refreshTokens;
    return u;
}
