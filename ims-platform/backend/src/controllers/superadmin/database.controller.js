'use strict';
const Company = require('../../models/superadmin/Company');
const mongoose = require('mongoose');

exports.list = async (req, res) => {
    try {
        const companies = await Company.find({ _mongoUri: { $exists: true, $ne: '' } }, 'companyName adminEmail _mongoUri databaseConfigured subscriptionStatus');
        const result = companies.map(c => ({
            _id: c._id,
            companyName: c.companyName,
            adminEmail: c.adminEmail,
            maskedUri: c.getMaskedUri(),
            databaseConfigured: c.databaseConfigured,
            subscriptionStatus: c.subscriptionStatus,
        }));
        res.json({ databases: result });
    } catch { res.status(500).json({ error: 'Failed to list databases' }); }
};

exports.testConnection = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ error: 'Company not found' });
        const uri = company.mongoUri;
        if (!uri) return res.status(400).json({ error: 'No database URI configured for this company' });
        // Try a quick connection
        const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
        await conn.close();
        res.json({ status: 'healthy', message: 'Connection successful' });
    } catch (err) {
        res.json({ status: 'error', message: err.message || 'Failed to connect' });
    }
};
