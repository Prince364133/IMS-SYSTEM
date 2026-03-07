'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ims-superadmin';
const TARGET_EMAIL = (process.argv[2] || 'zsnapyproo@gmail.com').toLowerCase();
const TEST_PASSWORD = process.argv[3] || '364133';

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to Superadmin DB');

        const Company = require('./src/models/superadmin/Company');
        const company = await Company.findOne({ adminEmail: TARGET_EMAIL }).select('+adminPasswordHash');

        if (!company) {
            console.log(`Company not found for ${TARGET_EMAIL} in Superadmin DB (as adminEmail)`);
            // Check if user exists in any company
            const allCompanies = await Company.find({});
            console.log(`Checking ${allCompanies.length} companies...`);

            for (const c of allCompanies) {
                if (c.mongoUri) {
                    try {
                        const conn = await mongoose.createConnection(c.mongoUri).asPromise();
                        const User = conn.model('User', new mongoose.Schema({ email: String, role: String, password: { type: String, select: true } }));
                        const user = await User.findOne({ email: TARGET_EMAIL });
                        if (user) {
                            console.log(`Found user in company: ${c.companyName} (${c.tenantId})`);
                            console.log(`Role: ${user.role}`);
                            const matchTenant = await bcrypt.compare(TEST_PASSWORD, user.password);
                            console.log(`Password "${TEST_PASSWORD}" matches: ${matchTenant}`);
                        }
                        await conn.close();
                    } catch (e) { }
                }
            }
        } else {
            console.log(`Company: ${company.companyName}`);
            const matchSuper = await bcrypt.compare(TEST_PASSWORD, company.adminPasswordHash);
            console.log(`Password "${TEST_PASSWORD}" matches Superadmin Hash: ${matchSuper}`);

            if (company.mongoUri) {
                try {
                    const conn = await mongoose.createConnection(company.mongoUri).asPromise();
                    const User = conn.model('User', new mongoose.Schema({}, { strict: false }));
                    const user = await User.findOne({ email: TARGET_EMAIL }).lean();

                    if (!user) {
                        console.log(`User ${TARGET_EMAIL} not found in Tenant DB`);
                    } else {
                        console.log(`User Document:`, JSON.stringify(user, null, 2));
                        console.log(`User: ${TARGET_EMAIL}`);
                        console.log(`Roles Array:`, user.roles);
                        console.log(`Role Field:`, user.role);
                    }
                    await conn.close();
                } catch (err) {
                    console.log(`Error connecting to tenant DB: ${err.message}`);
                }
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Inspection Error:', err);
    }
}

inspect();
