'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    register, login, logout, refreshToken,
    getMe, changePassword,
    setupMFA, enableMFA, verifyMFA,
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// MFA
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/enable', protect, enableMFA);
router.post('/mfa/verify', verifyMFA);

module.exports = router;
