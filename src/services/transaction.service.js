import api from './api';

export const incomeService = {
    create: async (incomeData) => {
        try {
            return await api.post('/incomes', incomeData);
        } catch (error) {
            console.error('Create income error:', error);
            throw error;
        }
    },

    getAll: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            return await api.get(`/incomes?${queryParams}`);
        } catch (error) {
            console.error('Get incomes error:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await api.get(`/incomes/${id}`);
        } catch (error) {
            console.error('Get income error:', error);
            throw error;
        }
    },

    update: async (id, incomeData) => {
        try {
            return await api.put(`/incomes/${id}`, incomeData);
        } catch (error) {
            console.error('Update income error:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await api.delete(`/incomes/${id}`);
        } catch (error) {
            console.error('Delete income error:', error);
            throw error;
        }
    },

    getCategorySummary: async (startDate, endDate) => {
        try {
            const queryParams = new URLSearchParams({ startDate, endDate }).toString();
            return await api.get(`/incomes/summary/category?${queryParams}`);
        } catch (error) {
            console.error('Get category summary error:', error);
            throw error;
        }
    }
};

export const expenseService = {
    create: async (expenseData) => {
        try {
            return await api.post('/expenses', expenseData);
        } catch (error) {
            console.error('Create expense error:', error);
            throw error;
        }
    },

    getAll: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            return await api.get(`/expenses?${queryParams}`);
        } catch (error) {
            console.error('Get expenses error:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await api.get(`/expenses/${id}`);
        } catch (error) {
            console.error('Get expense error:', error);
            throw error;
        }
    },

    update: async (id, expenseData) => {
        try {
            return await api.put(`/expenses/${id}`, expenseData);
        } catch (error) {
            console.error('Update expense error:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await api.delete(`/expenses/${id}`);
        } catch (error) {
            console.error('Delete expense error:', error);
            throw error;
        }
    },

    getCategorySummary: async (startDate, endDate) => {
        try {
            const queryParams = new URLSearchParams({ startDate, endDate }).toString();
            return await api.get(`/expenses/summary/category?${queryParams}`);
        } catch (error) {
            console.error('Get category summary error:', error);
            throw error;
        }
    },

    getMonthlySummary: async (year, month) => {
        try {
            return await api.get(`/expenses/summary/monthly/${year}/${month}`);
        } catch (error) {
            console.error('Get monthly summary error:', error);
            throw error;
        }
    }
};