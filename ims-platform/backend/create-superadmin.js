'use strict';

/**
 * Super Admin Seed Script
 * Run once: node create-superadmin.js
 *
 * Uses the SYSTEM MongoDB (platform's own cluster) to store the super admin account.
 * Override credentials via env vars if needed.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
    'mongodb+srv://princegupta3641_db_user:cMMzYMnAX3KDLg56@cluster0.fizmeb6.mongodb.net/ims_platform?appName=Cluster0';

// ─── SuperAdmin Schema (inline to avoid loading all models) ──────────────────
const SuperAdmin = (() => {
    try { return mongoose.model('SuperAdmin'); }
    catch { return require('./src/models/superadmin/SuperAdmin'); }
})();

async function main() {
    console.log('🔌 Connecting to system MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB (Cluster0)');

    const email = process.env.SA_EMAIL || 'superadmin@instaura.live';
    const password = process.env.SA_PASSWORD || 'SuperAdmin@2025!';
    const name = process.env.SA_NAME || 'Platform Owner';

    const existing = await SuperAdmin.findOne({ email });
    if (existing) {
        console.log(`\n⚠️  Super admin already exists: ${existing.email}`);
        console.log(`   Created: ${existing.createdAt}`);
        console.log(`   Last Login: ${existing.lastLogin || 'Never'}`);
        await mongoose.disconnect();
        return;
    }

    const admin = await SuperAdmin.create({ name, email, passwordHash: password });
    console.log(`\n🎉 Super Admin created successfully!\n`);
    console.log(`   Name    : ${admin.name}`);
    console.log(`   Email   : ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🔑 Login URL : http://localhost:3000/superadmin/login`);
    console.log(`🌐 Production: https://instaura.live/superadmin/login`);
    console.log(`\n⚠️  IMPORTANT: Change the password immediately after first login!\n`);

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌ Error creating super admin:', err.message);
    process.exit(1);
});
