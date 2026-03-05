'use strict';

const express = require('express');
const router = express.Router();

// Simple health endpoint — no auth required
router.get('/', async (req, res) => {
    const mongoose = require('mongoose');
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: dbState[mongoose.connection.readyState] || 'unknown',
        version: require('../../package.json').version,
    });
});

module.exports = router;
