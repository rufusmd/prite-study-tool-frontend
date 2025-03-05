// src/api/authApi.js
import api from '../utils/api';

const authApi = {
    // Register a new user
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    },

    // Login user with enhanced error logging
    login: async (credentials) => {
        try {
            console.log('Attempting login with:', { ...credentials, password: '***' });

            const response = await api.post('/auth/login', credentials);
            console.log('Login response:', response);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });

            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get user'
            };
        }
    },

    // Logout user (client-side only)
    logout: () => {
        localStorage.removeItem('token');
        return { success: true };
    }
};

export default authApi;