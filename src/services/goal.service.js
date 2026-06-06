import api from './api';

export const goalService = {
    create: async (goalData) => {
        try {
            return await api.post('/goals', goalData);
        } catch (error) {
            console.error('Create goal error:', error);
            throw error;
        }
    },

    getAll: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            return await api.get(`/goals?${queryParams}`);
        } catch (error) {
            console.error('Get goals error:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await api.get(`/goals/${id}`);
        } catch (error) {
            console.error('Get goal error:', error);
            throw error;
        }
    },

    update: async (id, goalData) => {
        try {
            return await api.put(`/goals/${id}`, goalData);
        } catch (error) {
            console.error('Update goal error:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await api.delete(`/goals/${id}`);
        } catch (error) {
            console.error('Delete goal error:', error);
            throw error;
        }
    },

    addContribution: async (id, amount) => {
        try {
            return await api.patch(`/goals/${id}/contribute`, { amount });
        } catch (error) {
            console.error('Add contribution error:', error);
            throw error;
        }
    },

    getStats: async () => {
        try {
            return await api.get('/goals/stats');
        } catch (error) {
            console.error('Get stats error:', error);
            throw error;
        }
    }
};