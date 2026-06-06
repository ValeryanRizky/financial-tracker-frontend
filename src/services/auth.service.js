// services/auth.service.js
const API_URL = 'http://localhost:5000/api';

// Helper untuk get token
const getToken = () => localStorage.getItem('token');

// Helper untuk handle response
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const authService = {
    // Login
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await handleResponse(response);
        if (data.success && data.data) {
            const { token, user } = data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        return data;
    },

    // Register
    register: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        const data = await handleResponse(response);
        if (data.success && data.data) {
            const { token, user } = data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        return data;
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
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await handleResponse(response);
        if (data.success && data.data) {
            localStorage.setItem('user', JSON.stringify(data.data));
        }
        return data;
    },

    // Update profile
    updateProfile: async (userData) => {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(userData)
        });
        const data = await handleResponse(response);
        if (data.success && data.data) {
            localStorage.setItem('user', JSON.stringify(data.data));
        }
        return data;
    },

    // Change password
    changePassword: async (oldPassword, newPassword) => {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });
        return handleResponse(response);
    }
};