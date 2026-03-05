'use strict';

const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'other'], default: 'casual' },
    startDate: { type: String, required: true },  // YYYY-MM-DD
    endDate: { type: String, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
    days: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
