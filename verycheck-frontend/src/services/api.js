import { API_BASE_URL } from '../config/constants';

class ApiService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(),
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || data.error || 'Request failed');
        }

        return data;
    }

    // Auth
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    // Users
    async getUserProfile(userId) {
        return this.request(`/users/${userId}`);
    }

    async getAllUsers() {
        return this.request('/users');
    }

    async getUserRentals(userId) {
        return this.request(`/users/${userId}/rentals`);
    }

    // Clubs
    async getAllClubs() {
        return this.request('/clubs');
    }

    async getClubById(clubId) {
        return this.request(`/clubs/${clubId}`);
    }

    async createClub(clubData) {
        return this.request('/clubs/create', {
            method: 'POST',
            body: JSON.stringify(clubData),
        });
    }

    // Items
    async createItem(itemData) {
        return this.request('/items/create', {
            method: 'POST',
            body: JSON.stringify(itemData),
        });
    }

    async rentItem(itemId) {
        return this.request(`/items/rent/${itemId}`, {
            method: 'POST',
        });
    }

    async returnItem(itemId, conditionReturned = 'good') {
        return this.request(`/items/return/${itemId}`, {
            method: 'POST',
            body: JSON.stringify({ conditionReturned }),
        });
    }

    async scanQRCode(qrData) {
        return this.request('/items/scan-qr', {
            method: 'POST',
            body: JSON.stringify({ qrCode: qrData }),
        });
    }

    // QR
    async generateQR(itemId) {
        return this.request(`/qr/generate/${itemId}`, {
            method: 'POST',
        });
    }

    async scanQR(qrCode) {
        return this.request('/qr/scan', {
            method: 'POST',
            body: JSON.stringify({ qrCode }),
        });
    }

    // AI
    async aiQuery(userQuery) {
        return this.request('/ai/query', {
            method: 'POST',
            body: JSON.stringify({ userQuery }),
        });
    }

    async predictDemand(itemId, window = 3) {
        return this.request('/ai/predict-demand', {
            method: 'POST',
            body: JSON.stringify({ itemId, window }),
        });
    }

    async recommendItems(mode, params) {
        return this.request('/ai/recommend', {
            method: 'POST',
            body: JSON.stringify({ mode, ...params }),
        });
    }

    async clubForecast(clubId, threshold = 1) {
        return this.request('/ai/club-forecast', {
            method: 'POST',
            body: JSON.stringify({ clubId, threshold }),
        });
    }
}

const api = new ApiService(API_BASE_URL);
export default api;