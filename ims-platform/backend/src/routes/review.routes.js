const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, requireAdminOrHR } = require('../middleware/auth');

router.get('/', protect, reviewController.getReviews);
router.get('/:id', protect, reviewController.getReviewById);
router.post('/', protect, reviewController.createReview);
router.put('/:id/self', protect, reviewController.submitSelfEvaluation);
router.put('/:id/manager', protect, reviewController.submitManagerEvaluation);
router.delete('/:id', protect, requireAdminOrHR, reviewController.deleteReview);

module.exports = router;
