const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function listUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ roles: 'admin' }).limit(1).lean();
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
}

listUsers().catch(console.error);
