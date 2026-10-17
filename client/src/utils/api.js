import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// An expired or revoked session (for example after a password reset) sends the user back to login.
// Only requests that carried a token are treated this way, so a wrong password at login is unaffected.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const hadToken = Boolean(error.config?.headers?.Authorization);
        if (error.response?.status === 401 && hadToken) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') window.location.assign('/login');
        }
        return Promise.reject(error);
    }
);

export default api;
