// ===== AUTH STATE =====
let currentUser = null;
let authToken = localStorage.getItem('token');

// ===== AUTH FUNCTIONS =====
const Auth = {
  getUser: () => currentUser,
  getToken: () => authToken,
  isLoggedIn: () => !!authToken,

  login: async (email, password) => {
    try {
      const result = await AuthAPI.login({ email, password });
      if (result.success) {
        currentUser = result.data.user;
        authToken = result.data.token;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        showNotification('Login successful!', 'success');
        return { success: true };
      }
      showNotification(result.message || 'Login failed', 'error');
      return { success: false };
    } catch (error) {
      showNotification('Login failed', 'error');
      return { success: false };
    }
  },

  register: async (username, email, password) => {
    try {
      const result = await AuthAPI.register({ username, email, password });
      if (result.success) {
        currentUser = result.data.user;
        authToken = result.data.token;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        showNotification('Registration successful!', 'success');
        return { success: true };
      }
      showNotification(result.message || 'Registration failed', 'error');
      return { success: false };
    } catch (error) {
      showNotification('Registration failed', 'error');
      return { success: false };
    }
  },

  logout: () => {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showNotification('Logged out', 'info');
    navigateTo('home');
  },

  loadUser: async () => {
    if (!authToken) return;
    try {
      const result = await AuthAPI.getMe(authToken);
      if (result.success) {
        currentUser = result.data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }
};

// ===== NAVIGATION =====
const navigateTo = (page, params = null) => {
  const mainContent = document.getElementById('mainContent');
  
  switch(page) {
    case 'home':
      renderHome(mainContent);
      break;
    case 'app':
      renderAppDetail(mainContent, params);
      break;
    case 'login':
      renderLogin(mainContent);
      break;
    case 'register':
      renderRegister(mainContent);
      break;
    case 'search':
      renderSearchResults(mainContent, params);
      break;
    default:
      renderHome(mainContent);
  }
};

// ===== NOTIFICATION =====
const showNotification = (message, type = 'info') => {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = message;
  document.body.appendChild(div);
  
  setTimeout(() => div.remove(), 3000);
};

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  // Load user
  Auth.loadUser();
  
  // Update auth button
  updateAuthButton();
  
  // Search
  document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query) navigateTo('search', { q: query });
  });
  
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) navigateTo('search', { q: query });
    }
  });
  
  // Nav links
  document.querySelector('.nav-home').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
  });
  
  document.getElementById('navAuth').addEventListener('click', (e) => {
    e.preventDefault();
    if (Auth.isLoggedIn()) {
      Auth.logout();
    } else {
      navigateTo('login');
    }
  });
});

// ===== UPDATE AUTH BUTTON =====
const updateAuthButton = () => {
  const btn = document.getElementById('navAuth');
  if (Auth.isLoggedIn()) {
    btn.textContent = 'Logout';
    btn.className = 'btn-primary';
  } else {
    btn.textContent = 'Login';
    btn.className = 'btn-primary';
  }
};
