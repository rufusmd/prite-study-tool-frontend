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

    // Login user
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return { success: true, data: response.data };
        } catch (error) {
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