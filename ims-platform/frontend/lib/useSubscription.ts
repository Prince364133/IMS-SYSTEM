'use client';

import { useEffect, useState, useCallback } from 'react';
import api from './api';

export interface SubscriptionStatus {
    subscription: any | null;
    plan: any | null;
    daysLeft: number;
    isExpired: boolean;
    isWarning: boolean;
    isTrialing: boolean;
    status: string;
    paymentsEnabled: boolean;
    currency: string;
    loading: boolean;
    refresh: () => void;
}

export function useSubscription(): SubscriptionStatus {
    const [data, setData] = useState<Omit<SubscriptionStatus, 'loading' | 'refresh'>>({
        subscription: null,
        plan: null,
        daysLeft: 999,
        isExpired: false,
        isWarning: false,
        isTrialing: false,
        status: 'active',
        paymentsEnabled: false,
        currency: 'INR',
    });
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const { data: res } = await api.get('/api/billing');
            setData(res);
        } catch {
            // Network error or subscription expired — fail gracefully
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    return { ...data, loading, refresh: fetchStatus };
}
