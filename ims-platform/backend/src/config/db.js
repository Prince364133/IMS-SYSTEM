'use strict';

const mongoose = require('mongoose');

let MONGO_URI = process.env.MONGO_URI;

const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

async function connectDB() {
    if (!MONGO_URI) {
        console.warn('⚠️ MONGO_URI is not defined. Server is running in Setup Mode.');
        return false;
    }

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

        return true;
    } catch (err) {
        console.error(`❌ MongoDB connection failed: ${err.message}`);
        console.warn('⚠️ Server is running in Setup Mode due to connection failure.');
        return false;
    }
}

async function testAndConnectDB(uri) {
    try {
        // Disconnect first if already connected
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        const conn = await mongoose.connect(uri, options);
        console.log(`✅ MongoDB Dynamic Connection Successful: ${conn.connection.host}`);
        MONGO_URI = uri; // Update local reference
        return true;
    } catch (err) {
        throw new Error(`Connection failed: ${err.message}`);
    }
}

module.exports = { connectDB, testAndConnectDB };
