'use strict';
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['travel', 'food', 'accommodation', 'equipment', 'software', 'training', 'other'], default: 'other' },
    date: { type: Date, required: true },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, default: '' },
}, { timestamps: true });

expenseSchema.index({ employeeId: 1, status: 1 });
module.exports = mongoose.model('Expense', expenseSchema);
