'use client';

import Link from 'next/link';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '../lib/useSubscription';

export default function TrialBanner() {
    const { isExpired, isWarning, isTrialing, daysLeft, status, loading } = useSubscription();
    const [dismissed, setDismissed] = useState(false);

    if (loading || dismissed || (!isWarning && !isExpired)) return null;

    const isCritical = daysLeft <= 2 || isExpired;

    return (
        <div className={`flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium
            ${isCritical
                ? 'bg-red-500 text-white'
                : 'bg-amber-400 text-amber-900'
            }`}>
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {isExpired ? (
                    <span>Your {isTrialing ? 'trial' : 'subscription'} has <strong>expired</strong>. Upgrade to restore access.</span>
                ) : (
                    <span>
                        {isTrialing ? 'Trial' : 'Subscription'} expires in{' '}
                        <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
                        {daysLeft <= 3 ? ' — Act now to avoid losing access!' : '.'}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/dashboard/billing"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                        ${isCritical ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-amber-900/20 text-amber-900 hover:bg-amber-900/30'}`}>
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade Plan
                </Link>
                {!isExpired && (
                    <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
