'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');
const connectDB = require('../config/db');

const seed = async () => {
    try {
        await connectDB();
        console.log('🌱 Starting system seeding...');

        // 1. Seed Default Settings
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({
                companyName: 'Internal Management System',
                themeColor: '#4f46e5',
                emailFrom: 'noreply@example.com',
                storageMode: 'cloudinary'
            });
            console.log('✅ Default settings created');
        } else {
            console.log('ℹ️ Settings already exist, skipping...');
        }

        // 2. Seed Default Admin
        const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';

        let admin = await User.findOne({ email: adminEmail.toLowerCase() });
        if (!admin) {
            admin = await User.create({
                name: 'System Admin',
                email: adminEmail.toLowerCase(),
                password: adminPassword,
                role: 'admin',
                department: 'Administration',
                position: 'Head of Operations',
                isActive: true
            });
            console.log(`✅ Default admin created: ${adminEmail}`);
            console.log(`🔑 Temporary Password: ${adminPassword}`);
        } else {
            console.log(`ℹ️ Admin ${adminEmail} already exists, skipping...`);
        }

        console.log('\n✨ Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
