// auth/authService.js
import api from './api';

const login = async (username, password) => {
    const response = await api.post('/login/', { username, password });
    if (response.status === 200) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
};

const logout = async () => {
    try {
        await api.post('/logout/', {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/api/login';
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token might be expired, try to refresh it
            try {
                const refreshResponse = await api.post('/refresh/', {
                    refresh: localStorage.getItem('refresh_token')
                });
                if (refreshResponse.status === 200) {
                    localStorage.setItem('access_token', refreshResponse.data.access);
                    // Retry logout with new token
                    await api.post('/logout/', {}, {
                        headers: {
                            'Authorization': `Bearer ${refreshResponse.data.access}`
                        }
                    });
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/api/login';
                }
            } catch (refreshError) {
                console.error('Token refresh failed', refreshError);
                // Handle token refresh failure (e.g., redirect to login)
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/api/login';
            }
        } else {
            console.error('Logout failed', error);
        }
    }
};

export { login, logout };