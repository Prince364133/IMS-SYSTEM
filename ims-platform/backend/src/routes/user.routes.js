'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin, requireHR } = require('../middleware/rbac');
const { upload, uploadToCloud } = require('../middleware/upload');
const {
    getUsers, getUserById, updateUser, deleteUser, updatePhoto,
} = require('../controllers/user.controller');

router.get('/', protect, requireHR, getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, requireAdmin, deleteUser);
router.put('/:id/photo', protect, upload.single('photo'), uploadToCloud('employees'), updatePhoto);

module.exports = router;
