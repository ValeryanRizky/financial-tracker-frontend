import api from './api';

export const balanceService = {
    getBalance: async () => {
        try {
            return await api.get('/balance');
        } catch (error) {
            console.error('Get balance error:', error);
            throw error;
        }
    },

    updateBalance: async (amount) => {
        try {
            return await api.put('/balance', { amount });
        } catch (error) {
            console.error('Update balance error:', error);
            throw error;
        }
    },

    getSummary: async () => {
        try {
            return await api.get('/balance/summary');
        } catch (error) {
            console.error('Get summary error:', error);
            throw error;
        }
    }
};