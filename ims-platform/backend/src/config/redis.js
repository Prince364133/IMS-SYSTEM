'use strict';

const { Redis } = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set — queue features will be disabled');
}

const redis = REDIS_URL
    ? new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    })
    : null;

if (redis) {
    redis.on('connect', () => console.log('✅ Upstash Redis connected'));
    redis.on('error', (err) => console.error('Redis error:', err.message));
}

module.exports = { redis };
