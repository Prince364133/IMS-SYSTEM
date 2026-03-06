'use strict';

const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
    {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        month: { type: String, required: true }, // YYYY-MM
        baseSalary: { type: Number, required: true, min: 0 },
        deductions: { type: Number, default: 0, min: 0 },
        bonuses: { type: Number, default: 0, min: 0 },
        netSalary: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'hr_approved', 'approved', 'paid'],
            default: 'pending',
        },
        paidAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Unique salary record per employee per month
salarySchema.index({ employeeId: 1, month: 1 }, { unique: true });
salarySchema.index({ status: 1 });
salarySchema.index({ month: 1 });

module.exports = mongoose.model('Salary', salarySchema);
