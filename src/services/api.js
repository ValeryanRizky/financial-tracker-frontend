// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL); // Untuk debugging

const api = {
    // GET request
    get: async (endpoint, headers = {}) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...headers
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || 'Request failed');
        }
        return response.json();
    },

    // POST request
    post: async (endpoint, data, headers = {}) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...headers
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || 'Request failed');
        }
        return response.json();
    },

    // PUT request
    put: async (endpoint, data, headers = {}) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...headers
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || 'Request failed');
        }
        return response.json();
    },

    // DELETE request
    delete: async (endpoint, headers = {}) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...headers
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || 'Request failed');
        }
        return response.json();
    },

    // PATCH request
    patch: async (endpoint, data, headers = {}) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...headers
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || 'Request failed');
        }
        return response.json();
    }
};

export default api;