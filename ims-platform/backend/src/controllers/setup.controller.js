'use strict';

const mongoose = require('mongoose');
const { testAndConnectDB } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

exports.getSetupStatus = async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        const User = require('../models/User');
        const adminExists = isConnected ? await User.exists({ role: 'admin' }) : false;

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

exports.configureDatabase = async (req, res, next) => {
    try {
        const { username, password, clusterUrl, connectionString: manualConnectionString } = req.body;

        let connectionString = '';
        if (manualConnectionString) {
            connectionString = manualConnectionString;
        } else if (username && password && clusterUrl) {
            // Clean clusterUrl if user pasted full string
            const cleanCluster = clusterUrl.replace(/^mongodb\+srv:\/\//i, '').split('/')[0];
            connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cleanCluster}/?retryWrites=true&w=majority`;
        }

        if (!connectionString) {
            return res.status(400).json({ success: false, error: 'Database credentials or connection string is required' });
        }

        // Test the connection
        await testAndConnectDB(connectionString);

        // If successful, update the .env file
        const envPath = path.join(__dirname, '../../.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or append the MONGO_URI
        if (envContent.includes('MONGO_URI=')) {
            envContent = envContent.replace(/^MONGO_URI=.*$/m, `MONGO_URI=${connectionString}`);
        } else {
            envContent += `\nMONGO_URI=${connectionString}\n`;
        }

        // Auto-generate JWT secrets if missing
        const crypto = require('crypto');
        if (!envContent.includes('JWT_SECRET=')) {
            const secret = crypto.randomBytes(32).toString('hex');
            envContent += `JWT_SECRET=${secret}\n`;
            process.env.JWT_SECRET = secret; // Update current process
        }
        if (!envContent.includes('JWT_REFRESH_SECRET=')) {
            const secret = crypto.randomBytes(32).toString('hex');
            envContent += `JWT_REFRESH_SECRET=${secret}\n`;
            process.env.JWT_REFRESH_SECRET = secret; // Update current process
        }
        if (!envContent.includes('PORT=')) {
            envContent += `PORT=5000\n`;
        }
        if (!envContent.includes('NODE_ENV=')) {
            envContent += `NODE_ENV=development\n`;
        }

        fs.writeFileSync(envPath, envContent);

        // Run the seed script programmatically in the background
        exec('npm run seed', { cwd: path.join(__dirname, '../../') }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Seeding error: ${error.message}`);
            }
            console.log(`Seeding output: ${stdout}`);
        });

        res.status(200).json({
            success: true,
            message: 'Database connected and seeded successfully. Application is ready.'
        });

    } catch (err) {
        console.error('Setup Database Error:', err);
        let errorMsg = err.message || 'Failed to connect to the database.';
        if (errorMsg.includes('authentication failed')) {
            errorMsg = 'Authentication failed: Please check your Database Username and Password.';
        } else if (errorMsg.includes('querySrv ENOTFOUND')) {
            errorMsg = 'Cluster not found: Please check your Cluster URL.';
        } else if (errorMsg.includes('cannot have port number')) {
            errorMsg = 'Invalid URL: mongodb+srv connections cannot include a port number (e.g., :27017).';
        }

        res.status(500).json({
            success: false,
            error: errorMsg
        });
    }
};
