const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth');

router.get('/', settingsController.getSettings); // Public or authenticated to read
router.put('/', protect, settingsController.updateSettings); // Admin only to update
router.post('/test-email', protect, settingsController.testEmailConnection); // Admin only to test
router.post('/test-ai', protect, settingsController.testAiConnection); // Admin only to test
router.post('/test-storage', protect, settingsController.testStorageConnection); // Admin only to test
router.post('/clear-data', protect, settingsController.clearDatabase); // Admin only to bulk delete data

module.exports = router;
