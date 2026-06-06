// src/services/wallet.service.js
import api from './api';

export const walletService = {
    // Create wallet
    create: async (walletData) => {
        try {
            return await api.post('/wallets', walletData);
        } catch (error) {
            console.error('Create wallet error:', error);
            throw error;
        }
    },

    // Get all wallets
    getAll: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            return await api.get(`/wallets?${queryParams}`);
        } catch (error) {
            console.error('Get wallets error:', error);
            throw error;
        }
    },

    // Get wallet by ID
    getById: async (id) => {
        try {
            return await api.get(`/wallets/${id}`);
        } catch (error) {
            console.error('Get wallet error:', error);
            throw error;
        }
    },

    // Update wallet
    update: async (id, walletData) => {
        try {
            return await api.put(`/wallets/${id}`, walletData);
        } catch (error) {
            console.error('Update wallet error:', error);
            throw error;
        }
    },

    // Update balance (method utama yang dipakai)
    updateBalance: async (id, balance) => {
        try {
            return await api.patch(`/wallets/${id}/balance`, { balance });
        } catch (error) {
            console.error('Update balance error:', error);
            throw error;
        }
    },

    // Delete wallet
    delete: async (id) => {
        try {
            return await api.delete(`/wallets/${id}`);
        } catch (error) {
            console.error('Delete wallet error:', error);
            throw error;
        }
    },

    // Get summary
    getSummary: async () => {
        try {
            return await api.get('/wallets/summary');
        } catch (error) {
            console.error('Get summary error:', error);
            throw error;
        }
    },

    // Add balance to wallet
    addBalance: async (walletId, amount) => {
        try {
            return await api.patch(`/wallets/${walletId}/add-balance`, { amount });
        } catch (error) {
            console.error('Add balance error:', error);
            throw error;
        }
    },

    // Subtract balance from wallet
    subtractBalance: async (walletId, amount) => {
        try {
            return await api.patch(`/wallets/${walletId}/subtract-balance`, { amount });
        } catch (error) {
            console.error('Subtract balance error:', error);
            throw error;
        }
    }
};