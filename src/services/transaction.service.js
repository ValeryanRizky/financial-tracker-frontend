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

// Income Services
export const incomeService = {
    // Create income
    create: async (incomeData) => {
        const response = await fetch(`${API_URL}/incomes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(incomeData)
        });
        return handleResponse(response);
    },

    // Get all incomes
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/incomes?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get income by ID
    getById: async (id) => {
        const response = await fetch(`${API_URL}/incomes/${id}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Update income
    update: async (id, incomeData) => {
        const response = await fetch(`${API_URL}/incomes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(incomeData)
        });
        return handleResponse(response);
    },

    // Delete income
    delete: async (id) => {
        const response = await fetch(`${API_URL}/incomes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get category summary
    getCategorySummary: async (startDate, endDate) => {
        const queryParams = new URLSearchParams({ startDate, endDate }).toString();
        const response = await fetch(`${API_URL}/incomes/summary/category?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    }
};

// Expense Services
export const expenseService = {
    // Create expense
    create: async (expenseData) => {
        const response = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(expenseData)
        });
        return handleResponse(response);
    },

    // Get all expenses
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/expenses?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get expense by ID
    getById: async (id) => {
        const response = await fetch(`${API_URL}/expenses/${id}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Update expense
    update: async (id, expenseData) => {
        const response = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(expenseData)
        });
        return handleResponse(response);
    },

    // Delete expense
    delete: async (id) => {
        const response = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get category summary
    getCategorySummary: async (startDate, endDate) => {
        const queryParams = new URLSearchParams({ startDate, endDate }).toString();
        const response = await fetch(`${API_URL}/expenses/summary/category?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get monthly summary
    getMonthlySummary: async (year, month) => {
        const response = await fetch(`${API_URL}/expenses/summary/monthly/${year}/${month}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    }
};