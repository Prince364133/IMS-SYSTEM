'use strict';
const mongoose = require('mongoose');

// A Review Cycle (manager creates this for an employee)
const reviewSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true }, // e.g. "Q1 2025", "Annual 2025"
    dueDate: { type: Date },
    status: { type: String, enum: ['draft', 'self_eval_pending', 'manager_eval_pending', 'complete'], default: 'self_eval_pending' },
    // Self evaluation
    selfRatings: [{
        category: String,        // e.g. "Teamwork", "Delivery"
        rating: Number,          // 1-5
        comments: String,
    }],
    selfSummary: { type: String, default: '' },
    selfSubmittedAt: Date,
    // Manager evaluation
    managerRatings: [{
        category: String,
        rating: Number,
        comments: String,
    }],
    managerSummary: { type: String, default: '' },
    overallRating: { type: Number, min: 1, max: 5 }, // final score
    managerSubmittedAt: Date,
    // Shared goals for next period
    nextPeriodGoals: { type: String, default: '' },
}, { timestamps: true });

reviewSchema.index({ employeeId: 1, period: 1 });
module.exports = mongoose.model('Review', reviewSchema);
