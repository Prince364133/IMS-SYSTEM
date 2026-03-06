'use client';

import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import saApi from './superadmin-api';

interface SuperAdmin {
    _id: string;
    name: string;
    email: string;
    role: string;
    lastLogin?: string;
}

interface SuperAdminContextType {
    superAdmin: SuperAdmin | null;
    loading: boolean;
    logout: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
    const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('superadmin_token');
        if (!token) { setLoading(false); return; }
        saApi.get('/auth/me')
            .then(({ data }) => setSuperAdmin(data.superAdmin))
            .catch(() => { localStorage.removeItem('superadmin_token'); })
            .finally(() => setLoading(false));
    }, []);

    const logout = () => {
        localStorage.removeItem('superadmin_token');
        setSuperAdmin(null);
        router.push('/superadmin/login');
    };

    return (
        <SuperAdminContext.Provider value={{ superAdmin, loading, logout }}>
            {children}
        </SuperAdminContext.Provider>
    );
}

export function useSuperAdmin() {
    const ctx = useContext(SuperAdminContext);
    if (!ctx) throw new Error('useSuperAdmin must be used within SuperAdminProvider');
    return ctx;
}
