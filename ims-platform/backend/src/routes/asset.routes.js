const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', assetController.getAssets);
router.get('/stats', assetController.getAssetStats);
router.get('/:id', assetController.getAssetById);

// Manager/Admin only for write operations
router.post('/', authorize('admin', 'manager'), assetController.createAsset);
router.put('/:id', authorize('admin', 'manager'), assetController.updateAsset);
router.delete('/:id', authorize('admin', 'manager'), assetController.deleteAsset);

module.exports = router;
