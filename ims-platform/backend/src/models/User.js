'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        // ── Core identity ──────────────────────────────────────────────────────────
        name: { type: String, required: [true, 'Name is required'], trim: true },
        email: {
            type: String, required: [true, 'Email is required'],
            unique: true, lowercase: true, trim: true,
        },
        password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
        roles: {
            type: [String],
            enum: ['admin', 'manager', 'hr', 'employee', 'client'],
            default: ['employee'],
        },

        // ── Profile ────────────────────────────────────────────────────────────────
        photoUrl: { type: String, default: '' },
        phone: { type: String, default: '' },
        isActive: { type: Boolean, default: true },

        // ── HR / Employee fields ───────────────────────────────────────────────────
        employeeId: { type: String, trim: true, uppercase: true, sparse: true },
        department: { type: String, default: '' },
        position: { type: String, default: '' },
        joinDate: { type: Date },
        salary: { type: Number, default: 0, min: 0 },
        leaveBalance: { type: Number, default: 20, min: 0 },
        emergencyContact: { type: String, default: '' },
        bankAccount: { type: String, select: false, default: '' },

        // ── MFA ───────────────────────────────────────────────────────────────────
        mfaEnabled: { type: Boolean, default: false },
        mfaSecret: { type: String, select: false },

        // ── Refresh tokens (stored hashed) ────────────────────────────────────────
        refreshTokens: [{ type: String, select: false }],

        // ── Soft delete ───────────────────────────────────────────────────────────
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true, unique: true });
// ── Pre-save: Ensure roles is array and handle single role input ───────────
userSchema.pre('save', async function (next) {
    if (this.role && (!this.roles || this.roles.length === 0)) {
        this.roles = [this.role];
    }
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ── Method: compare password ──────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
    return bcrypt.compare(entered, this.password);
};

// ── Virtual: role (for backward compatibility) ────────────────────────────────
userSchema.virtual('role')
    .get(function () {
        return this.roles && this.roles.length > 0 ? this.roles[0] : 'employee';
    })
    .set(function (val) {
        if (!this.roles) this.roles = [];
        if (!this.roles.includes(val)) this.roles.push(val);
    });

// ── Virtual: fullName alias ───────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () { return this.name; });

// ── Prevent deleted users from appearing in normal queries ────────────────────
userSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

// ── Ensure virtuals are included in JSON/Object ──────────────────────────────
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.index({ roles: 1 });

module.exports = mongoose.model('User', userSchema);
