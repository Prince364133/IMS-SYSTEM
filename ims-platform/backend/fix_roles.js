'use strict';
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ims-superadmin';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to Superadmin DB');

        const Company = require('./src/models/superadmin/Company');
        const companies = await Company.find({ databaseConfigured: true });
        console.log(`🔍 Found ${companies.length} configured companies to migrate.`);

        for (const company of companies) {
            console.log(`\n🏢 Migrating Company: ${company.companyName} (${company.tenantId})`);
            if (!company.mongoUri) {
                console.log(`   ⚠️ No Mongo URI found, skipping.`);
                continue;
            }

            try {
                const conn = await mongoose.createConnection(company.mongoUri).asPromise();
                // Simple schema to access roles and set role
                const UserSchema = new mongoose.Schema({
                    roles: [String],
                    role: String
                }, { strict: false });

                const User = conn.model('User', UserSchema);
                const users = await User.find({});
                console.log(`   👥 Found ${users.length} users.`);

                let updatedCount = 0;
                for (const user of users) {
                    const primaryRole = (user.roles && user.roles.length > 0) ? user.roles[0] : 'employee';

                    // Update if role is missing or different from primary roles element
                    if (!user.role || user.role !== primaryRole) {
                        await User.updateOne({ _id: user._id }, { $set: { role: primaryRole } });
                        updatedCount++;
                    }
                }
                console.log(`   ✨ Updated ${updatedCount} users.`);
                await conn.close();
            } catch (err) {
                console.error(`   ❌ Error migrating company ${company.companyName}:`, err.message);
            }
        }

        console.log('\n✅ Migration complete!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Migration Error:', err);
    }
}

migrate();
