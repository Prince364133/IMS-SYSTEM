'use strict';

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    process.exit(1);
}

const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

async function connectDB() {
    try {
        const conn = await mongoose.connect(MONGO_URI, options);
        console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected.');
        });
    } catch (err) {
        console.error(`❌ MongoDB connection failed: ${err.message}`);
        throw err;
    }
}

module.exports = connectDB;
