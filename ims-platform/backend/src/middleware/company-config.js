'use strict';

const CompanyConfig = require('../models/CompanyConfig');

/**
 * Middleware to attach company configuration to the request object.
 * This allows controllers to easily access branding and contact info.
 */
module.exports = async (req, res, next) => {
    try {
        let config = await CompanyConfig.findOne();
        if (!config) {
            // Create default if not found
            config = await CompanyConfig.create({});
        }
        req.company = config;
        next();
    } catch (err) {
        console.error('Error fetching company config:', err);
        next(); // Proceed regardless to avoid blocking the system
    }
};
