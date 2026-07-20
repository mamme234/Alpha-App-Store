// ===== API CONFIGURATION =====
const API_URL = 'http://localhost:5000/api';

const api = {
  get: async (endpoint, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    return res.json();
  },
  
  post: async (endpoint, data, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return res.json();
  },

  put: async (endpoint, data, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (endpoint, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE', headers });
    return res.json();
  }
};

// ===== APP API =====
const AppAPI = {
  getAll: (params = '') => api.get(`/apps${params}`),
  getFeatured: () => api.get('/apps/featured'),
  getTrending: () => api.get('/apps/trending'),
  getOne: (id) => api.get(`/apps/${id}`),
  create: (data, token) => api.post('/apps', data, token),
  toggleFavorite: (appId, token) => api.post(`/apps/${appId}/favorite`, {}, token)
};

// ===== AUTH API =====
const AuthAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: (token) => api.get('/auth/me', token)
};

// ===== REVIEW API =====
const ReviewAPI = {
  getByApp: (appId) => api.get(`/reviews/${appId}`),
  create: (data, token) => api.post('/reviews', data, token)
};
