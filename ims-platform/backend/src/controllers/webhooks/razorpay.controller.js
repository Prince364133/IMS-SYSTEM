'use strict';

const crypto = require('crypto');
const PlatformSettings = require('../../models/superadmin/PlatformSettings');
const Subscription = require('../../models/superadmin/Subscription');
const Plan = require('../../models/superadmin/Plan');
const BillingService = require('../../services/billing.service');

/**
 * Razorpay Webhook Controller
 * Handles asynchronous payment and subscription events.
 */
exports.handleWebhook = async (req, res, next) => {
    try {
        const settings = await PlatformSettings.getInstance();
        const webhookSecret = settings.razorpayWebhookSecret;

        if (!webhookSecret) {
            console.error('[Razorpay Webhook] Webhook secret not configured in settings.');
            return res.status(400).json({ error: 'Webhook secret not configured' });
        }

        // Verify Razorpay Signature
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing signature' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.rawBody || JSON.stringify(req.body))
            .digest('hex');

        // Note: Razorpay signature verification can be tricky with express.json(). 
        // If this fails, we may need to use the raw body buffer.
        if (expectedSignature !== signature) {
            console.warn('[Razorpay Webhook] Signature mismatch');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`[Razorpay Webhook] Received event: ${event}`);

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload.payment.entity);
                break;
            case 'subscription.activated':
            case 'subscription.charged':
                await handleSubscriptionEvent(payload.subscription.entity, 'active');
                break;
            case 'subscription.halted':
            case 'subscription.pending':
                await handleSubscriptionEvent(payload.subscription.entity, 'past_due');
                break;
            case 'subscription.cancelled':
            case 'subscription.expired':
                await handleSubscriptionEvent(payload.subscription.entity, 'expired');
                break;
            default:
                console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
        }

        res.json({ status: 'ok' });
    } catch (err) {
        console.error('[Razorpay Webhook] Error:', err.message);
        next(err);
    }
};

/**
 * Handle successful payment (captured)
 */
async function handlePaymentCaptured(payment) {
    const { order_id, id: payment_id, notes } = payment;

    // Check if this payment is associated with a plan subscription
    if (notes && notes.planId) {
        console.log(`[Razorpay Webhook] Processing payment for plan: ${notes.planId}`);
        // We can use processPayment from BillingService if we have all tokens, 
        // but since this is an async webhook, we might just update the subscription status.
        // For now, let's look for an existing pending subscription.
        const sub = await Subscription.findOne({ razorpayOrderId: order_id });
        if (sub && sub.paymentStatus !== 'paid') {
            sub.paymentStatus = 'paid';
            sub.paymentId = payment_id;
            sub.status = 'active';
            await sub.save();
            console.log(`[Razorpay Webhook] Subscription ${sub._id} marked as PAID via payment.captured`);
        }
    }
}

/**
 * Handle subscription status updates
 */
async function handleSubscriptionEvent(razorpaySub, status) {
    const sub = await Subscription.findOne({ razorpaySubscriptionId: razorpaySub.id });
    if (sub) {
        sub.status = status;
        if (status === 'active') sub.paymentStatus = 'paid';
        await sub.save();
        console.log(`[Razorpay Webhook] Subscription ${sub._id} updated to status: ${status}`);
    } else {
        console.warn(`[Razorpay Webhook] Subscription not found for Razorpay ID: ${razorpaySub.id}`);
    }
}
