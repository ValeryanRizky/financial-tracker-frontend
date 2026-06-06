const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const walletService = {
    // Create wallet
    create: async (walletData) => {
        const response = await fetch(`${API_URL}/wallets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(walletData)
        });
        return handleResponse(response);
    },

    // Get all wallets
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/wallets?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get wallet by ID
    getById: async (id) => {
        const response = await fetch(`${API_URL}/wallets/${id}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Update wallet
    update: async (id, walletData) => {
        const response = await fetch(`${API_URL}/wallets/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(walletData)
        });
        return handleResponse(response);
    },

    // Delete wallet
    delete: async (id) => {
        const response = await fetch(`${API_URL}/wallets/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // Get summary
    getSummary: async () => {
        const response = await fetch(`${API_URL}/wallets/summary`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return handleResponse(response);
    },

    // 🔥 PERBAIKAN: Add balance to wallet
    addBalance: async (walletId, amount) => {
        const response = await fetch(`${API_URL}/wallets/${walletId}/add-balance`, {
            method: 'PATCH', // atau 'PUT' tergantung backend Anda
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ amount })
        });
        return handleResponse(response);
    },

    // 🔥 PERBAIKAN: Subtract balance from wallet
    subtractBalance: async (walletId, amount) => {
        const response = await fetch(`${API_URL}/wallets/${walletId}/subtract-balance`, {
            method: 'PATCH', // atau 'PUT' tergantung backend Anda
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ amount })
        });
        return handleResponse(response);
    },
};