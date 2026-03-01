const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
        },
        description: { type: String, default: '' },
        requirements: { type: String, default: '' },
        department: { type: String, default: '' },
        location: { type: String, default: '' },
        type: {
            type: String,
            enum: ['full_time', 'part_time', 'contract', 'internship'],
            default: 'full_time',
        },
        salaryMin: { type: Number },
        salaryMax: { type: Number },
        status: {
            type: String,
            enum: ['open', 'closed', 'paused', 'filled'],
            default: 'open',
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        closeDate: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
