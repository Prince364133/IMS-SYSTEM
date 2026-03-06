const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');
dotenv.config();

async function checkUser() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'princegupta22@gmail.com' }).select('+roles +role');
    console.log('User:', JSON.stringify(user, null, 2));
    process.exit(0);
}

checkUser();
