'use strict';
const mongoose = require('mongoose');
const { getIo } = require('../../sockets'); // If needed inside schemas

// Cache of tenant connections to avoid exhausting connection pools
const tenantConnections = {};

/**
 * Gets or creates a Mongoose database connection for a specific tenant.
 * @param {String} companyId - The ID of the tenant's company.
 * @param {String} mongoUri - The MongoDB connection string for the tenant.
 * @returns {mongoose.Connection} The tenant's isolated database connection.
 */
exports.getTenantConnection = async (companyId, mongoUri) => {
    if (!companyId || !mongoUri) {
        throw new Error('companyId and mongoUri are required to get tenant connection');
    }

    const tenantIdStr = companyId.toString();

    // Return cached connection if it exists and is open
    if (tenantConnections[tenantIdStr] && tenantConnections[tenantIdStr].readyState === 1) {
        return tenantConnections[tenantIdStr];
    }

    // Create a new isolated connection
    console.log(`[DB Manager] Creating new connection for tenant: ${tenantIdStr}`);

    const db = mongoose.createConnection(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    // Handle connection errors
    db.on('error', (err) => {
        console.error(`[DB Manager] Tenant DB connection error (${tenantIdStr}):`, err);
    });

    // Await successful connection
    await new Promise((resolve, reject) => {
        db.once('open', resolve);
        db.once('error', reject);
    });

    // Load models into this specific connection
    loadTenantModels(db);

    tenantConnections[tenantIdStr] = db;
    return db;
};

/**
 * Destroys a tenant connection (e.g., if their subscription ends or they are deleted).
 */
exports.destroyTenantConnection = async (companyId) => {
    const tenantIdStr = companyId.toString();
    if (tenantConnections[tenantIdStr]) {
        console.log(`[DB Manager] Closing connection for tenant: ${tenantIdStr}`);
        await tenantConnections[tenantIdStr].close();
        delete tenantConnections[tenantIdStr];
    }
};

/**
 * Injects all schemas into the tenant connection.
 * We require the existing model files and extract their schemas.
 */
function loadTenantModels(conn) {
    const schemas = {
        'User': require('../models/User').schema,
        'Project': require('../models/Project').schema,
        'Task': require('../models/Task').schema,
        'Client': require('../models/Client').schema,
        'Attendance': require('../models/Attendance').schema,
        'Leave': require('../models/Leave').schema,
        'Job': require('../models/Job').schema,
        'JobApplication': require('../models/JobApplication').schema,
        'Settings': require('../models/Settings').schema,
        'File': require('../models/File').schema,
        'Notification': require('../models/Notification').schema,
        'Chat': require('../models/Chat').schema,
        'Automation': require('../models/Automation').schema,
        'EmailTemplate': require('../models/EmailTemplate').schema,
        'AuditLog': require('../models/AuditLog').schema,
        'Salary': require('../models/Salary').schema,
        'Expense': require('../models/Expense').schema,
        'Invoice': require('../models/Invoice').schema,
        'Review': require('../models/Review').schema,
        'CalendarEvent': require('../models/CalendarEvent').schema,
        'Asset': require('../models/Asset').schema,
        'Inventory': require('../models/Inventory').schema,
        'Milestone': require('../models/Milestone').schema,
        'TimeLog': require('../models/TimeLog').schema,
    };

    for (const [name, schema] of Object.entries(schemas)) {
        if (!conn.models[name]) {
            conn.model(name, schema);
        }
    }
}
