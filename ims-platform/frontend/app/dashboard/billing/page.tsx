'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Shield, Zap, Check, Tag, Loader2, AlertCircle, Calendar, Users, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../../lib/api';
import { useSubscription } from '../../../lib/useSubscription';

declare global { interface Window { Razorpay: any; } }

function PlanCard({ plan, current, onUpgrade, disabled }: any) {
    const isCurrentPlan = current?.planId?._id === plan._id || current?.planId === plan._id;
    return (
        <div className={`relative bg-white border-2 rounded-2xl p-6 transition-all ${isCurrentPlan ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'}`}>
            {plan.isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">MOST POPULAR</div>}
            {isCurrentPlan && <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">CURRENT PLAN</div>}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.planName}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-gray-900">₹{plan.price?.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 text-sm">/{plan.billingCycle || 'month'}</span>
                </div>
            </div>
            <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Up to <strong>{plan.maxUsers}</strong> users</span>
                </div>
                {plan.features?.slice(0, 5).map((f: string) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                    </div>
                ))}
            </div>
            <button onClick={() => onUpgrade(plan)} disabled={disabled || isCurrentPlan}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
                    ${isCurrentPlan ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {isCurrentPlan ? 'Current Plan' : 'Upgrade to ' + plan.planName}
            </button>
        </div>
    );
}

export default function BillingPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [coupon, setCoupon] = useState('');
    const [couponResult, setCouponResult] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const { subscription, plan, daysLeft, isExpired, isTrialing, status, paymentsEnabled, currency, refresh } = useSubscription();

    useEffect(() => {
        api.get('/api/billing/plans').then(r => setPlans(r.data.plans));
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && !window.Razorpay) {
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            document.head.appendChild(s);
        }
    }, []);

    const validateCoupon = async () => {
        if (!coupon || !selectedPlan) return;
        setCouponLoading(true);
        try {
            const { data } = await api.post('/api/billing/coupon', { couponCode: coupon, planId: selectedPlan._id });
            setCouponResult(data);
            toast.success(`Coupon applied! You save ₹${data.discountAmount.toLocaleString('en-IN')}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Invalid coupon');
            setCouponResult(null);
        }
        setCouponLoading(false);
    };

    const handleUpgrade = async (chosenPlan: any) => {
        if (!paymentsEnabled) { toast.error('Payments not enabled. Contact support.'); return; }
        setSelectedPlan(chosenPlan);
        setPaymentLoading(true);
        try {
            const { data: order } = await api.post('/api/billing/order', {
                planId: chosenPlan._id,
                couponCode: couponResult ? coupon : undefined,
            });

            const options = {
                key: order.keyId,
                amount: order.amount * 100,
                currency: order.currency || 'INR',
                name: 'Instaura IMS',
                description: `${order.planName} Plan`,
                order_id: order.orderId,
                handler: async (response: any) => {
                    try {
                        await api.post('/api/billing/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            planId: chosenPlan._id,
                            couponCode: couponResult ? coupon : undefined,
                        });
                        toast.success(`🎉 ${order.planName} plan activated!`);
                        refresh();
                    } catch { toast.error('Payment verification failed. Contact support.'); }
                },
                prefill: {},
                theme: { color: '#4f46e5' },
                modal: { ondismiss: () => setPaymentLoading(false) },
            };
            const rz = new window.Razorpay(options);
            rz.open();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create order');
        }
        setPaymentLoading(false);
    };

    const statusBadge = {
        trial: 'bg-amber-100 text-amber-700 border border-amber-200',
        active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        expired: 'bg-red-100 text-red-700 border border-red-200',
    }[status] || 'bg-gray-100 text-gray-600';

    const expiryDate = isTrialing ? subscription?.trialEndDate : subscription?.subscriptionEndDate;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-6 h-6 text-indigo-600" /> Billing & Subscription</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your plan, upgrade, and billing information</p>
            </div>

            {/* Current Status */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-indigo-200 text-sm font-medium mb-1">Current Plan</p>
                        <h2 className="text-2xl font-bold">{plan?.planName || 'Free Trial'}</h2>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize ${statusBadge}`}>
                            {status}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-200 text-sm">{isTrialing ? 'Trial ends' : 'Renews on'}</p>
                        <p className="text-xl font-bold">{expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                        {!isExpired && (
                            <p className={`text-sm mt-1 font-semibold ${daysLeft <= 3 ? 'text-red-300' : daysLeft <= 7 ? 'text-amber-300' : 'text-indigo-200'}`}>
                                {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                            </p>
                        )}
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-indigo-200">Max Users</p>
                        <p className="font-bold text-lg">{plan?.maxUsers || '—'}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-indigo-200">Status</p>
                        <p className="font-bold text-lg capitalize">{status}</p>
                    </div>
                </div>
            </div>

            {/* Upgrade Plans */}
            {!isExpired || true ? (
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Available Plans</h2>
                    {plans.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl">No plans configured yet. Contact your Super Admin.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {plans.map(p => (
                                <PlanCard key={p._id} plan={p} current={subscription} onUpgrade={handleUpgrade} disabled={paymentLoading || !paymentsEnabled} />
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            {/* Coupon */}
            {paymentsEnabled && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-500" /> Apply Coupon Code</h3>
                    <div className="flex gap-2">
                        <input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null); }}
                            placeholder="Enter coupon code" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={validateCoupon} disabled={!coupon || !selectedPlan || couponLoading}
                            className="px-4 py-2.5 bg-indigo-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5">
                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                    </div>
                    {couponResult && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Discount: <strong>₹{couponResult.discountAmount.toLocaleString('en-IN')}</strong> off → Final: <strong>₹{couponResult.finalAmount.toLocaleString('en-IN')}</strong>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Select a plan first, then apply your coupon before checkout.</p>
                </div>
            )}

            {/* Non-refundable notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                    <strong>Refund Policy:</strong> All subscription payments are <strong>non-refundable</strong>. By completing a purchase you agree to our Terms of Service.
                </div>
            </div>
        </div>
    );
}
