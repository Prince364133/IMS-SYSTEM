'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');

router.get('/insights', protect, requireManager, aiController.getDashboardInsights);
router.get('/projects/:id/insights', protect, aiController.getProjectInsights);

module.exports = router;
