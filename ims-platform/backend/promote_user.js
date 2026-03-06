const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');
dotenv.config();

async function promoteAdmin() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'princegupta22@gmail.com' });
    if (user) {
        user.roles = ['admin', 'manager', 'hr', 'employee'];
        await user.save();
        console.log('User promoted to Admin, Manager, HR, and Employee');
    } else {
        console.log('User not found');
    }
    process.exit(0);
}

promoteAdmin();
