'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'hr' | 'employee' | 'client';
    photoUrl?: string;
    department?: string;
    position?: string;
    employeeId?: string;
    isActive?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string, mfaToken?: string) => Promise<{ mfaRequired?: boolean; userId?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('ims_token');
        if (storedToken) {
            setToken(storedToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            fetchMe().finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    async function fetchMe() {
        try {
            const { data } = await api.get('/api/auth/me');
            setUser(data.user);
        } catch {
            localStorage.removeItem('ims_token');
            localStorage.removeItem('ims_refresh');
            setToken(null);
            setUser(null);
        }
    }

    const login = async (email: string, password: string, mfaToken?: string) => {
        const { data } = await api.post('/api/auth/login', { email, password, mfaToken });
        if (data.mfaRequired) return { mfaRequired: true, userId: data.userId };

        localStorage.setItem('ims_token', data.token);
        localStorage.setItem('ims_refresh', data.refreshToken);
        setToken(data.token);
        setUser(data.user);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return {};
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('ims_refresh');
            await api.post('/api/auth/logout', { refreshToken });
        } catch { }
        localStorage.removeItem('ims_token');
        localStorage.removeItem('ims_refresh');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        router.push('/login');
    };

    const refreshUser = async () => {
        await fetchMe();
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
