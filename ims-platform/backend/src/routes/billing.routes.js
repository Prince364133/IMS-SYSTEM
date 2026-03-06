const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getStatus,
    getPlans,
    createOrder,
    verifyPayment,
    validateCoupon,
    triggerCron,
} = require('../controllers/billing.controller');

// All billing routes require authentication
router.use(protect);

// GET  /api/billing        — current subscription status (all authenticated users)
router.get('/', getStatus);

// GET  /api/billing/plans  — list available plans (all authenticated users)
router.get('/plans', getPlans);

// Admin-only routes below
router.use(authorize('admin'));

// POST /api/billing/order   — create Razorpay order
router.post('/order', createOrder);

// POST /api/billing/verify  — verify payment + activate subscription
router.post('/verify', verifyPayment);

// POST /api/billing/coupon  — validate coupon code
router.post('/coupon', validateCoupon);

// POST /api/billing/cron-test — manual cron trigger (debug)
router.post('/cron-test', triggerCron);

module.exports = router;
