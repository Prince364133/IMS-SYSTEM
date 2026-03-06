'use strict';

const mongoose = require('mongoose');

const companyConfigSchema = new mongoose.Schema(
    {
        // Branding
        companyName: { type: String, default: 'Internal Management System' },
        companyLogo: { type: String, default: '' },
        emailLogo: { type: String, default: '' },
        tagline: { type: String, default: 'Precision in Management' },
        brandColor: { type: String, default: '#6366f1' },
        websiteUrl: { type: String, default: '' },

        // Contact Information
        companyEmail: { type: String, default: '' },
        supportEmail: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        officePhone: { type: String, default: '' },
        customerSupportNumber: { type: String, default: '' },

        // Company Details (Legal)
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        gstNumber: { type: String, default: '' },
        registrationNumber: { type: String, default: '' },
        cinNumber: { type: String, default: '' },

        // Financial Details
        bankName: { type: String, default: '' },
        accountHolderName: { type: String, default: '' },
        bankAccountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        paymentInstructions: { type: String, default: '' },

        // HR / Document Details
        hrEmail: { type: String, default: '' },
        hrPhone: { type: String, default: '' },
        authorizedSignatory: { type: String, default: '' },
        designation: { type: String, default: '' },
        signatureImage: { type: String, default: '' },

        // Chat Settings
        employeeClientChatAllowed: { type: Boolean, default: true },

        // Payroll Settings
        salaryReleaseDate: { type: Number, default: 1 }, // 1st to 28th
        workingDaysPerMonth: { type: Number, default: 22 },

        // Email Branding Additional
        emailFooterText: { type: String, default: '' },
        copyrightText: { type: String, default: '' },
        socialLinks: {
            facebook: { type: String, default: '' },
            twitter: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            instagram: { type: String, default: '' },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CompanyConfig', companyConfigSchema);
