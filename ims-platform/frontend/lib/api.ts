import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    console.warn('NEXT_PUBLIC_API_URL is not defined. API calls may fail.');
}

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach latest token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('ims_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (
            error.response?.status === 401 &&
            !original._retry &&
            typeof window !== 'undefined'
        ) {
            original._retry = true;
            try {
                const refreshToken = localStorage.getItem('ims_refresh');
                if (!refreshToken) throw new Error('No refresh token');
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
                    { refreshToken }
                );
                localStorage.setItem('ims_token', data.token);
                original.headers.Authorization = `Bearer ${data.token}`;
                return api(original);
            } catch {
                localStorage.removeItem('ims_token');
                localStorage.removeItem('ims_refresh');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
