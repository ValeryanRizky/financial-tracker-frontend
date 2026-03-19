const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const goalService = {
    // Create goal
    create: async (goalData) => {
        const response = await fetch(`${API_URL}/goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(goalData)
        });
        return handleResponse(response);
    },

    // Get all goals
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/goals?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get goal by ID
    getById: async (id) => {
        const response = await fetch(`${API_URL}/goals/${id}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Update goal
    update: async (id, goalData) => {
        const response = await fetch(`${API_URL}/goals/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(goalData)
        });
        return handleResponse(response);
    },

    // Delete goal
    delete: async (id) => {
        const response = await fetch(`${API_URL}/goals/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Add contribution
    addContribution: async (id, amount) => {
        const response = await fetch(`${API_URL}/goals/${id}/contribute`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ amount })
        });
        return handleResponse(response);
    },

    // Get stats
    getStats: async () => {
        const response = await fetch(`${API_URL}/goals/stats`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    }
};