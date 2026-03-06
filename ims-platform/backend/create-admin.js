const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/User');

async function createAdmin() {
    await mongoose.connect(process.env.MONGO_URI);
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    const user = await User.findOneAndUpdate(
        { email: 'testadmin@instaura.com' },
        {
            name: 'Test Admin',
            email: 'testadmin@instaura.com',
            password: hashedPassword,
            roles: ['admin'],
            isActive: true
        },
        { upsert: true, new: true }
    );
    console.log('Admin user created:', user.email);
    await mongoose.disconnect();
}

createAdmin().catch(console.error);
