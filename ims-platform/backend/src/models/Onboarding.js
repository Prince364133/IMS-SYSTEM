'use strict';
const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    recruitmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' }, // link back to hire
    step: { type: Number, default: 1 }, // 1=personal, 2=documents, 3=complete
    status: { type: String, enum: ['pending', 'in_progress', 'complete'], default: 'pending' },
    // Step 1 — Personal Info
    personalInfo: {
        phone: String,
        address: String,
        emergencyContact: String,
        emergencyPhone: String,
        dateOfBirth: String,
        bloodGroup: String,
    },
    // Step 2 — Document links
    documents: {
        idProofUrl: String,
        offerLetterUrl: String,
        educationCertUrl: String,
        otherDocUrls: [String],
    },
    // Step 3 — Welcome acknowledgement
    welcomeAcknowledgedAt: Date,
    completedAt: Date,
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Onboarding', onboardingSchema);
