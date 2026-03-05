const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth');

router.get('/', settingsController.getSettings); // Public or authenticated to read
router.put('/', protect, settingsController.updateSettings); // Admin only to update

module.exports = router;
