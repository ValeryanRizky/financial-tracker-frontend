const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const balanceService = {
    // Get balance
    getBalance: async () => {
        const response = await fetch(`${API_URL}/balance`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Update balance
    updateBalance: async (amount) => {
        const response = await fetch(`${API_URL}/balance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ amount })
        });
        return handleResponse(response);
    },

    // Get summary (balance + all goals)
    getSummary: async () => {
        const response = await fetch(`${API_URL}/balance/summary`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    }
};