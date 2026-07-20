// ===== API CONFIG =====
const API_URL = window.location.origin + 'https://alpha-app-store.onrender.com/api';

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
  }
};

// ===== APP API =====
const AppAPI = {
  getAll: () => api.get('/apps'),
  getFeatured: () => api.get('/apps/featured'),
  getTrending: () => api.get('/apps/trending'),
  getOne: (id) => api.get(`/apps/${id}`),
  submit: (data, token) => api.post('/apps/submit', data, token),
  toggleFavorite: (appId, token) => api.post(`/apps/${appId}/favorite`, {}, token)
};

// ===== AUTH API =====
const AuthAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: (token) => api.get('/auth/me', token)
};
