'use client';

import Link from 'next/link';
import { ShieldOff, Zap } from 'lucide-react';

export default function SubscriptionExpiredWall() {
    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <ShieldOff className="w-10 h-10 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white mb-3">Subscription Expired</h1>
                    <p className="text-slate-400 leading-relaxed">
                        Your trial or subscription period has ended. Please upgrade your plan to continue using the IMS platform.
                    </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What happens to your data?</p>
                    <p className="text-sm text-slate-400">✅ Your data is safe and securely stored</p>
                    <p className="text-sm text-slate-400">✅ All records retained for 30 days</p>
                    <p className="text-sm text-slate-400">✅ Instant access restored on upgrade</p>
                </div>
                <Link href="/dashboard/billing"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm">
                    <Zap className="w-4 h-4" />
                    Upgrade My Plan
                </Link>
                <p className="text-xs text-slate-600">
                    Need help? Contact <a href="mailto:support@instaura.live" className="text-indigo-400 hover:underline">support@instaura.live</a>
                </p>
            </div>
        </div>
    );
}
