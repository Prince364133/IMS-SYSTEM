'use strict';

const mongoose = require('mongoose');
const { testAndConnectDB } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Helper to get System Company Model
function getSystemCompanyModel() {
    return mongoose.model('Company');
}

exports.getSetupStatus = async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        const User = require('../models/User');
        const adminExists = isConnected ? await User.exists({ roles: 'admin' }) : false;

        res.status(200).json({
            success: true,
            isConfigured: isConnected,
            adminExists: !!adminExists
        });
    } catch (err) {
        res.status(200).json({
            success: true,
            isConfigured: mongoose.connection.readyState === 1,
            adminExists: false
        });
    }
};

// --- Multi-Tenant Setup Methods ---

exports.registerTenant = async (req, res) => {
    try {
        const { companyName, adminName, adminEmail, adminPassword } = req.body;

        if (!companyName || !adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({ success: false, error: 'All fields (companyName, adminName, adminEmail, adminPassword) are required.' });
        }

        const Company = getSystemCompanyModel();

        // Check if admin email already exists globally in System DB
        const existingCompany = await Company.findOne({ adminEmail: adminEmail.toLowerCase() });
        if (existingCompany) {
            return res.status(409).json({ success: false, error: 'A company is already registered with this admin email.' });
        }

        const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

        // Generate a temporary setup token (valid until DB configured)
        const setupToken = crypto.randomBytes(32).toString('hex');

        // Create the company shell in the System DB
        const newCompany = await Company.create({
            companyName,
            adminName,
            adminEmail: adminEmail.toLowerCase(),
            adminPasswordHash,
            databaseConfigured: false,
            subscriptionStatus: 'trial',
            metadata: { setupToken }
        });

        res.status(201).json({
            success: true,
            message: 'Company registered. Please configure database.',
            setupToken,
            companyId: newCompany._id
        });

    } catch (err) {
        console.error('Register Tenant Error:', err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            const message = field === 'companyName'
                ? 'A company with this name is already registered.'
                : 'A company is already registered with this admin email.';
            return res.status(409).json({ success: false, error: message });
        }
        res.status(500).json({ success: false, error: 'Failed to register company.' });
    }
};

exports.configureTenant = async (req, res) => {
    try {
        const { setupToken, username, password, clusterUrl, connectionString: manualConnectionString } = req.body;

        if (!setupToken) {
            return res.status(400).json({ success: false, error: 'Setup token is required' });
        }

        const Company = getSystemCompanyModel();
        const company = await Company.findOne({ 'metadata.setupToken': setupToken });

        if (!company) {
            return res.status(404).json({ success: false, error: 'Invalid or expired setup token' });
        }

        // Build the tenant's connection string
        let connectionString = '';
        if (manualConnectionString) {
            connectionString = manualConnectionString;
        } else if (username && password && clusterUrl) {
            let cleanCluster = clusterUrl.trim();
            cleanCluster = cleanCluster.replace(/^mongodb(\+srv)?:\/\//i, ''); // Remove protocol
            if (cleanCluster.includes('@')) {
                cleanCluster = cleanCluster.split('@').pop(); // Remove credentials
            }
            cleanCluster = cleanCluster.split('/')[0].split('?')[0]; // Remove path and query params

            connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cleanCluster}/?retryWrites=true&w=majority`;
        }

        if (!connectionString) {
            return res.status(400).json({ success: false, error: 'Database credentials or connection string is required' });
        }

        // 1. Test the connection specifically for this URI
        const tenantConn = mongoose.createConnection(connectionString, {
            serverSelectionTimeoutMS: 5000 // 5 second timeout to fail fast
        });

        await new Promise((resolve, reject) => {
            tenantConn.on('connected', () => resolve());
            tenantConn.on('error', (err) => reject(err));
        });

        console.log(`✅ Passed connection test for tenant DB: ${company.companyName}`);

        // 2. Update System DB With Encrypted URI & Clean Token
        company.mongoUri = connectionString;
        company.databaseConfigured = true;
        company.metadata.setupToken = null; // remove used token
        await company.save();

        // 3. Instead of local seed script child process, compile models locally on this connection to seed immediately
        const userSchema = require('../models/User').schema; // get raw schema
        const settingsSchema = require('../models/Settings').schema;

        const TenantUser = tenantConn.model('User', userSchema);
        const TenantSettings = tenantConn.model('Settings', settingsSchema);

        // Seed default settings for tenant
        let settings = await TenantSettings.findOne();
        if (!settings) {
            await TenantSettings.create({
                companyName: company.companyName,
                themeColor: '#4f46e5',
                emailFrom: 'noreply@internal.system',
                storageMode: 'cloudinary'
            });
            console.log(`✅ Default settings seeded for ${company.companyName}`);
        }

        // Seed the Admin User into the Tenant DB
        let adminUser = await TenantUser.findOne({ email: company.adminEmail });
        if (!adminUser) {
            await TenantUser.create({
                name: company.adminName,
                email: company.adminEmail,
                password: 'temp_will_never_be_checked_locally', // Local tenant auth password logic bypasses
                roles: ['admin'],
                isActive: true
            });
            // Overwrite password directly to match systemic hash for safety if ever queried
            await TenantUser.updateOne({ email: company.adminEmail }, { password: company.adminPasswordHash });
            console.log(`✅ Admin user seeded for ${company.companyName}`);
        }

        // Map Admin in the System Database for Central Login
        const TenantUserMapping = require('../models/superadmin/TenantUserMapping');
        await TenantUserMapping.findOneAndUpdate(
            { email: company.adminEmail.toLowerCase() },
            { companyId: company._id },
            { upsert: true }
        );
        console.log(`✅ Admin user mapped in System DB for Login`);

        // Close setup connection
        await tenantConn.close();

        res.status(200).json({
            success: true,
            message: 'Database configured and seeded successfully. Application is ready.'
        });

    } catch (err) {
        console.error('Configure Tenant Error:', err);
        let errorMsg = err.message || 'Failed to connect to the database.';
        if (errorMsg.includes('authentication failed')) {
            errorMsg = 'Authentication failed: Please check your Database Username and Password.';
        } else if (errorMsg.includes('querySrv ENOTFOUND') || errorMsg.includes('getaddrinfo ENOTFOUND')) {
            errorMsg = 'Cluster not found: Please check your Cluster URL.';
        }

        res.status(500).json({ success: false, error: errorMsg });
    }
};

// Legacy method for standalone deployment
exports.configureDatabase = async (req, res, next) => {
    // ... [Original Logic preserved for `.env` updates] ...
    try {
        const { username, password, clusterUrl, connectionString: manualConnectionString } = req.body;

        let connectionString = '';
        if (manualConnectionString) {
            connectionString = manualConnectionString;
        } else if (username && password && clusterUrl) {
            let cleanCluster = clusterUrl.trim();
            cleanCluster = cleanCluster.replace(/^mongodb(\+srv)?:\/\//i, ''); // Remove protocol
            if (cleanCluster.includes('@')) {
                cleanCluster = cleanCluster.split('@').pop(); // Remove credentials
            }
            cleanCluster = cleanCluster.split('/')[0].split('?')[0]; // Remove path and query params

            connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cleanCluster}/?retryWrites=true&w=majority`;
        }

        if (!connectionString) {
            return res.status(400).json({ success: false, error: 'Database credentials or connection string is required' });
        }

        await testAndConnectDB(connectionString);

        const envPath = path.join(__dirname, '../../.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        if (envContent.includes('MONGO_URI=')) {
            envContent = envContent.replace(/^MONGO_URI=.*$/m, `MONGO_URI=${connectionString}`);
        } else {
            envContent += `\nMONGO_URI=${connectionString}\n`;
        }

        if (!envContent.includes('JWT_SECRET=')) {
            const secret = crypto.randomBytes(32).toString('hex');
            envContent += `JWT_SECRET=${secret}\n`;
            process.env.JWT_SECRET = secret;
        }
        if (!envContent.includes('JWT_REFRESH_SECRET=')) {
            const secret = crypto.randomBytes(32).toString('hex');
            envContent += `JWT_REFRESH_SECRET=${secret}\n`;
            process.env.JWT_REFRESH_SECRET = secret;
        }

        fs.writeFileSync(envPath, envContent);

        exec('npm run seed', { cwd: path.join(__dirname, '../../') }, (error, stdout, stderr) => {
            if (error) console.error(`Seeding error: ${error.message}`);
            console.log(`Seeding output: ${stdout}`);
        });

        res.status(200).json({
            success: true,
            message: 'Legacy database setup connected and seeded successfully.'
        });

    } catch (err) {
        console.error('Setup Database Error:', err);
        res.status(500).json({ success: false, error: 'Failed to connect to the database.' });
    }
};
