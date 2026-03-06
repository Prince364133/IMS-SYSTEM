import axios from 'axios';

const saApi = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/superadmin`,
    timeout: 15000,
});

saApi.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

saApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('superadmin_token');
            window.location.href = '/superadmin/login';
        }
        return Promise.reject(err);
    }
);

export default saApi;
