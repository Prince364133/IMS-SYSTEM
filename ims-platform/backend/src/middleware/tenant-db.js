'use strict';
const jwt = require('jsonwebtoken');
const Company = require('../models/superadmin/Company');
const dbManager = require('../utils/dbManager');

/**
 * Middleware to intercept requests, identify the tenant (company),
 * and attach the tenant's database connection to the request object.
 */
async function tenantDbMiddleware(req, res, next) {
    try {
        let companyId = req.headers['x-tenant-id'];

        // If no explicit header, try to extract from JWT token
        if (!companyId) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    // Decode without verifying signature first just to get companyId
                    // protect middleware will verify signature later
                    const decoded = jwt.decode(token);
                    if (decoded && decoded.companyId) {
                        companyId = decoded.companyId;
                    }
                } catch (e) {
                    // Ignore decode errors here, let auth middleware handle them
                }
            }
        }

        if (!companyId) {
            // Some routes don't need a tenant DB (like superadmin or setup)
            // Just proceed without setting req.tenantDb
            return next();
        }

        // 1. Fetch Company from System DB
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Tenant (Company) not found in system.' });
        }

        if (!company.databaseConfigured) {
            return res.status(403).json({ error: 'Tenant database is not configured yet.' });
        }

        // 2. Get connection from dbManager
        const tenantDb = await dbManager.getTenantConnection(company._id, company.mongoUri);

        // 3. Attach to request
        req.tenantDb = tenantDb;
        req.company = company;

        next();
    } catch (err) {
        console.error('[Tenant DB Middleware Error]', err);
        return res.status(500).json({ error: 'Failed to connect to tenant database.' });
    }
}

module.exports = tenantDbMiddleware;
