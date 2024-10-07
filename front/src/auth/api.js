// auth/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            console.warn('No access token found in localStorage 1');
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);-

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const { data } = await axios.post('http://localhost:8000/api/token/refresh/', { refresh: refreshToken });
                    localStorage.setItem('access_token', data.access);
                    api.defaults.headers.Authorization = `Bearer ${data.access}`;
                    return api(originalRequest);
                } catch (err) {
                    console.error('Refresh token failed', err);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/api/login';
                }
            }
            else {
                console.warn('No refresh token found in localStorage');
                window.location.href = '/api/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;