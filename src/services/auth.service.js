// src/services/auth.service.js
import api from './api';

export const authService = {
    // Login
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.success && response.data) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            }
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Register
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.success && response.data) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            }
            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    // Get current user from localStorage
    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Get token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Fetch user profile from backend
    getProfile: async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.success && response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    // Update profile
    updateProfile: async (userData) => {
        try {
            const response = await api.put('/users/profile', userData);
            if (response.success && response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    // Change password
    changePassword: async (oldPassword, newPassword) => {
        try {
            return await api.put('/auth/change-password', { oldPassword, newPassword });
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
};