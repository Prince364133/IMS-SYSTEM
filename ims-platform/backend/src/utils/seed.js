'use strict';

require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Attendance = require('../models/Attendance');
const { logAction } = require('../middleware/audit');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin3641@instaura.live';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Instaura364133';

async function seed() {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // ── Admin user ───────────────────────────────────────────────────────────────
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
        admin = await User.create({
            name: 'Instaura Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            isActive: true,
        });
        console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
    } else {
        console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL}`);
    }

    // ── Sample HR user ────────────────────────────────────────────────────────────
    let hr = await User.findOne({ email: 'hr@instaura.live' });
    if (!hr) {
        hr = await User.create({
            name: 'HR Manager',
            email: 'hr@instaura.live',
            password: 'HRInstaura@2024',
            role: 'hr',
            employeeId: 'EMP001',
            department: 'Human Resources',
            position: 'HR Manager',
            salary: 75000,
            isActive: true,
        });
        console.log('✅ HR user created: hr@instaura.live');
    }

    // ── Sample employee ────────────────────────────────────────────────────────────
    let emp = await User.findOne({ email: 'employee@instaura.live' });
    if (!emp) {
        emp = await User.create({
            name: 'John Employee',
            email: 'employee@instaura.live',
            password: 'Employee@2024',
            role: 'employee',
            employeeId: 'EMP002',
            department: 'Engineering',
            position: 'Frontend Developer',
            salary: 55000,
            isActive: true,
        });
        console.log('✅ Employee created: employee@instaura.live');
    }

    // ── Sample client ──────────────────────────────────────────────────────────────
    let client = await Client.findOne({ email: 'client@example.com' });
    if (!client) {
        client = await Client.create({
            name: 'Acme Corp',
            email: 'client@example.com',
            company: 'Acme Corporation',
            phone: '+91 9999999999',
            website: 'https://acme.com',
            notes: 'Primary client for demo purposes',
        });
        console.log('✅ Client created: Acme Corp');
    }

    // ── Sample project ─────────────────────────────────────────────────────────────
    const existingProject = await Project.findOne({ name: 'IMS Platform Launch' });
    if (!existingProject) {
        await Project.create({
            name: 'IMS Platform Launch',
            description: 'Migration and production launch of the Instaura Internal Management System',
            status: 'in_progress',
            priority: 'critical',
            progress: 45,
            tags: ['migration', 'production', 'nextjs', 'mongodb'],
            ownerId: admin._id,
            clientId: client._id,
            memberIds: [admin._id, hr._id, emp._id],
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });
        console.log('✅ Sample project created');
    }

    console.log('\n✅ Seed complete!\n');
    console.log('─── Login Credentials ───────────────────────────────────');
    console.log(`Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log('HR:       hr@instaura.live / HRInstaura@2024');
    console.log('Employee: employee@instaura.live / Employee@2024');
    console.log('─────────────────────────────────────────────────────────\n');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
