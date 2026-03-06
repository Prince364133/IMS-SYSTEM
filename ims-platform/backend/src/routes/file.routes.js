'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const { upload, handleUpload } = require('../middleware/upload');
const ctrl = require('../controllers/file.controller');

router.post('/upload', protect, upload.single('file'), handleUpload('general'), ctrl.uploadFile);
router.post('/link', protect, ctrl.addFileLink);
router.get('/', protect, ctrl.getFiles);
router.delete('/:id', protect, requireHR, ctrl.deleteFile);

module.exports = router;
