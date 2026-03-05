'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR, requireManager } = require('../middleware/rbac');
const ctrl = require('../controllers/client.controller');

router.get('/', protect, requireManager, ctrl.getClients);
router.post('/', protect, requireHR, ctrl.createClient);
router.get('/:id', protect, ctrl.getClientById);
router.put('/:id', protect, requireHR, ctrl.updateClient);
router.delete('/:id', protect, requireHR, ctrl.deleteClient);

module.exports = router;
