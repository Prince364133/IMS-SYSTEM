'use strict';

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Client name is required'], trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, default: '' },
        company: { type: String, default: '' },
        address: { type: String, default: '' },
        website: { type: String, default: '' },
        notes: { type: String, default: '' },
        logoUrl: { type: String, default: '' },
        clientId: { type: String, unique: true, sparse: true, uppercase: true },

        // ── Enterprise Fields ──────────────────────────────────────────────────────
        industry: { type: String, default: '' },
        clientType: { type: String, enum: ['Enterprise', 'Startup', 'Individual', 'Other', ''], default: '' },
        taxId: { type: String, default: '' },
        billingAddress: { type: String, default: '' },
        status: { type: String, enum: ['active', 'inactive', 'lead'], default: 'active' },

        // ── Relations ──────────────────────────────────────────────────────────────
        projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],

        // ── Linked user account (optional — for client portal login) ───────────────
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

        // ── Soft delete ────────────────────────────────────────────────────────────
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

clientSchema.index({ email: 1 });
clientSchema.index({ name: 'text', company: 'text' });
clientSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

module.exports = mongoose.model('Client', clientSchema);
