'use strict';

const CompanyConfig = require('../models/CompanyConfig');

exports.getCompanyConfig = async (req, res, next) => {
    try {
        let config = await CompanyConfig.findOne();
        if (!config) {
            // Initialize with defaults if none exists
            config = await CompanyConfig.create({});
        }
        res.json({ config });
    } catch (err) { next(err); }
};

exports.updateCompanyConfig = async (req, res, next) => {
    try {
        let config = await CompanyConfig.findOne();
        if (!config) {
            config = await CompanyConfig.create(req.body);
        } else {
            // Update existing
            config = await CompanyConfig.findByIdAndUpdate(config._id, req.body, { new: true, runValidators: true });
        }
        res.json({ config, message: 'Company configuration updated successfully' });
    } catch (err) { next(err); }
};
