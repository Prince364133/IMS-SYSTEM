'use strict';
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');

router.get('/', protect, expenseController.getExpenses);
router.post('/', protect, expenseController.createExpense);
router.put('/:id/review', protect, requireHR, expenseController.reviewExpense);
router.delete('/:id', protect, expenseController.deleteExpense);

module.exports = router;
