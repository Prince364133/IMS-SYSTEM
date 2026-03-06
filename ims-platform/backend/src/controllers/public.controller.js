'use strict';

const { Job, Application } = require('../models/Job');
const Settings = require('../models/Settings');
const crypto = require('crypto');

/**
 * Get all open job postings (API Key protected)
 */
exports.getPublicJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({ status: 'open' })
            .select('title description department type location salaryRange requirements roleCategory openings customFields createdAt')
            .lean();

        const protocol = req.protocol;
        const host = req.get('host');

        const jobsWithLinks = jobs.map(job => ({
            ...job,
            applicationLink: `${protocol}://${host}/jobs/apply/${job._id}`
        }));

        res.json({ jobs: jobsWithLinks });
    } catch (err) {
        next(err);
    }
};

/**
 * Get a single job's details for the public application form
 */
exports.getPublicJobDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id)
            .select('title description department type location roleCategory customFields')
            .lean();

        if (!job || job.status === 'closed') {
            return res.status(404).json({ error: 'Job not found or already closed' });
        }

        res.json({ job });
    } catch (err) {
        next(err);
    }
};

/**
 * Submit a job application (Public)
 */
exports.submitApplication = async (req, res, next) => {
    try {
        const { jobId, applicantName, applicantEmail, phone, resumeUrl, coverLetter, customFields } = req.body;

        if (!jobId || !applicantName || !applicantEmail) {
            return res.status(400).json({ error: 'Missing required applicant fields' });
        }

        const job = await Job.findById(jobId);
        if (!job || job.status !== 'open') {
            return res.status(404).json({ error: 'Job is no longer open for applications' });
        }

        const application = await Application.create({
            jobId,
            applicantName,
            applicantEmail,
            phone,
            resumeUrl,
            coverLetter,
            customFields: customFields || {}
        });

        res.status(201).json({
            message: 'Application submitted successfully',
            applicationId: application._id
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Manage API Key (IMS Internal)
 */
exports.getApiKey = async (req, res, next) => {
    try {
        const settings = await Settings.findOne();
        res.json({ apiKey: settings?.recruitmentApiKey || '' });
    } catch (err) {
        next(err);
    }
};

exports.generateApiKey = async (req, res, next) => {
    try {
        const newKey = crypto.randomBytes(32).toString('hex');
        await Settings.findOneAndUpdate({}, { recruitmentApiKey: newKey }, { upsert: true });
        res.json({ apiKey: newKey });
    } catch (err) {
        next(err);
    }
};
