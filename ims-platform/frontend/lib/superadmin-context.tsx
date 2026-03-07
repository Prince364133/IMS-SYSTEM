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
    login: (token: string, admin: SuperAdmin) => void;
    fetchSuperAdmin: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
    const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchSuperAdmin = async () => {
        const token = localStorage.getItem('superadmin_token');
        if (!token) return;
        try {
            const { data } = await saApi.get('/auth/me');
            setSuperAdmin(data.superAdmin);
        } catch {
            logout();
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('superadmin_token');
        if (!token) { setLoading(false); return; }
        fetchSuperAdmin().finally(() => setLoading(false));
    }, []);

    const login = (token: string, admin: SuperAdmin) => {
        localStorage.setItem('superadmin_token', token);
        setSuperAdmin(admin);
        router.push('/superadmin');
    };

    const logout = () => {
        localStorage.removeItem('superadmin_token');
        setSuperAdmin(null);
        router.push('/superadmin/login');
    };

    return (
        <SuperAdminContext.Provider value={{ superAdmin, loading, logout, login, fetchSuperAdmin }}>
            {children}
        </SuperAdminContext.Provider>
    );
}

export function useSuperAdmin() {
    const ctx = useContext(SuperAdminContext);
    if (!ctx) throw new Error('useSuperAdmin must be used within SuperAdminProvider');
    return ctx;
}
