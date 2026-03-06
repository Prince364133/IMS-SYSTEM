const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['domain', 'server', 'api', 'license', 'repo', 'service'],
        default: 'service'
    },
    provider: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'pending', 'inactive'],
        default: 'active'
    },
    renewalDate: {
        type: Date
    },
    cost: {
        type: Number,
        default: 0
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', 'one-time'],
        default: 'monthly'
    },
    url: {
        type: String,
        trim: true
    },
    description: {
        type: String
    },
    credentials: {
        // Secure snippets, keys, or login info (unencrypted for now, user should rely on DB security)
        type: Map,
        of: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate status based on renewal date if applicable
assetSchema.pre('save', function (next) {
    if (this.renewalDate && this.renewalDate < new Date()) {
        this.status = 'expired';
    }
    next();
});

module.exports = mongoose.model('Asset', assetSchema);
