const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
        },
        applicantName: { type: String, required: [true, 'Applicant name is required'], trim: true },
        email: { type: String, required: [true, 'Email is required'], lowercase: true },
        phone: { type: String, default: '' },
        resumeUrl: { type: String, default: '' },
        coverLetter: { type: String, default: '' },
        experience: { type: String, default: '' },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'],
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        notes: { type: String, default: '' },
        interviewAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
