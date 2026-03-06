'use strict';
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect, requireAdminOrHR } = require('../middleware/auth');

// Categories
router.get('/categories', protect, inventoryController.getCategories);
router.post('/categories', protect, requireAdminOrHR, inventoryController.createCategory);

// Items
router.get('/items', protect, inventoryController.getItems);
router.get('/items/:id', protect, inventoryController.getItemById);
router.post('/items', protect, requireAdminOrHR, inventoryController.createItem);
router.put('/items/:id', protect, requireAdminOrHR, inventoryController.updateItem);
router.delete('/items/:id', protect, requireAdminOrHR, inventoryController.deleteItem);

// Transactions
router.get('/transactions', protect, inventoryController.getTransactions);
router.post('/transactions', protect, requireAdminOrHR, inventoryController.addTransaction);

module.exports = router;
