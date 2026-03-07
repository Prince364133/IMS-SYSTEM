'use strict';
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ims-superadmin';

async function listUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        const Company = require('./src/models/superadmin/Company');
        const company = await Company.findOne({ adminEmail: 'saaviksolutions@gmail.com' });

        if (!company || !company.mongoUri) {
            console.log('Company not found or no URI');
            return;
        }

        const conn = await mongoose.createConnection(company.mongoUri).asPromise();
        const User = conn.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find({}).lean();

        console.log(`Users in ${company.companyName} DB:`);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`);
        });

        await conn.close();
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listUsers();
