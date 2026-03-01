const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        // ── Core identity ─────────────────────────────────────────────
        name: { type: String, required: [true, 'Name is required'], trim: true },
        email: {
            type: String, required: [true, 'Email is required'],
            unique: true, lowercase: true, trim: true,
        },
        password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
        role: {
            type: String,
            enum: ['admin', 'manager', 'employee', 'client', 'hr'],
            default: 'employee',
        },

        // ── Profile ───────────────────────────────────────────────────
        photoUrl: { type: String, default: '' },
        phone: { type: String, default: '' },
        isActive: { type: Boolean, default: true },

        // ── HR / Employee fields (HRMS integration) ───────────────────
        employeeId: { type: String, trim: true, uppercase: true },   // e.g. EMP001 — indexed via userSchema.index() below
        department: { type: String, default: '' },
        position: { type: String, default: '' },
        joinDate: { type: Date },
        salary: { type: Number, default: 0, min: 0 },
        leaveBalance: { type: Number, default: 20, min: 0 },   // remaining leave days
        emergencyContact: { type: String, default: '' },

        // ── Sensitive (never returned by default) ─────────────────────
        bankAccount: { type: String, select: false, default: '' },
    },
    { timestamps: true }
);

// Sparse index so only employees with an ID use index storage
userSchema.index({ employeeId: 1 }, { sparse: true, unique: true });

// Pre-save: hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance method: compare password
userSchema.methods.matchPassword = async function (entered) {
    return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
