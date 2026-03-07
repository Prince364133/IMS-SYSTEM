'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ims-superadmin';
const TEST_PASSWORD = '364133';
const TARGET_EMAIL = 'zsnapyproo@gmail.com'.toLowerCase();

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to Superadmin DB');

        const Company = require('./src/models/superadmin/Company');
        const company = await Company.findOne({ adminEmail: TARGET_EMAIL }).select('+adminPasswordHash');

        if (!company) {
            console.log(`Company not found for ${TARGET_EMAIL}`);
        } else {
            console.log(`Company: ${company.companyName}`);
            const matchSuper = await bcrypt.compare(TEST_PASSWORD, company.adminPasswordHash);
            console.log(`Password "${TEST_PASSWORD}" matches Superadmin Hash: ${matchSuper}`);

            if (company.mongoUri) {
                try {
                    const conn = await mongoose.createConnection(company.mongoUri).asPromise();
                    const User = conn.model('User', new mongoose.Schema({ email: String, password: { type: String, select: true } }));
                    const user = await User.findOne({ email: TARGET_EMAIL });

                    if (!user) {
                        console.log(`User ${TARGET_EMAIL} not found in Tenant DB`);
                    } else {
                        const matchTenant = await bcrypt.compare(TEST_PASSWORD, user.password);
                        console.log(`Password "${TEST_PASSWORD}" matches Tenant Hash: ${matchTenant}`);
                        console.log(`Tenant Hash: ${user.password}`);
                        console.log(`Super Hash:  ${company.adminPasswordHash}`);
                        console.log(`Hashes Equal? ${user.password === company.adminPasswordHash}`);
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
