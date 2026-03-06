'use strict';

const express = require('express');
const router = express.Router();
const companyConfigController = require('../controllers/company-config.controller');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

router.get('/', protect, companyConfigController.getCompanyConfig);
router.put('/', protect, requireAdmin, companyConfigController.updateCompanyConfig);

module.exports = router;
