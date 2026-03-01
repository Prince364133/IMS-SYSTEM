const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Client name is required'],
            trim: true,
        },
        email: { type: String, lowercase: true, trim: true, default: '' },
        phone: { type: String, default: '' },
        company: { type: String, default: '' },
        address: { type: String, default: '' },
        logoUrl: { type: String, default: '' },
        status: {
            type: String,
            enum: ['active', 'inactive', 'prospect'],
            default: 'active',
        },
        notes: { type: String, default: '' },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
