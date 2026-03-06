'use strict';

const mongoose = require('mongoose');

// ── Job Posting ────────────────────────────────────────────────────────────────
const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        department: { type: String, default: '' },
        type: {
            type: String,
            enum: ['full_time', 'part_time', 'contract', 'internship'],
            default: 'full_time',
        },
        location: { type: String, default: '' },
        salaryRange: { type: String, default: '' },
        requirements: [{ type: String }],
        roleCategory: { type: String, default: 'General' },
        openings: { type: Number, default: 1 },
        customFields: [
            {
                label: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String, enum: ['text', 'textarea', 'number', 'url', 'file'], default: 'text' },
                required: { type: Boolean, default: false },
            }
        ],
        status: {
            type: String,
            enum: ['open', 'closed', 'on_hold'],
            default: 'open',
        },
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deadline: { type: Date },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

jobSchema.index({ status: 1 });
jobSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

const Job = mongoose.model('Job', jobSchema);

// ── Application ────────────────────────────────────────────────────────────────
const applicationSchema = new mongoose.Schema(
    {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
        applicantName: { type: String, required: true, trim: true },
        applicantEmail: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, default: '' },
        resumeUrl: { type: String, default: '' },
        coverLetter: { type: String, default: '' },
        customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
        status: {
            type: String,
            enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
            default: 'applied',
        },
        notes: { type: String, default: '' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ applicantEmail: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = { Job, Application };
