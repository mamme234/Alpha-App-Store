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
        showNotification('✅ Login successful!', 'success');
        updateUI();
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
        showNotification('✅ Registration successful!', 'success');
        updateUI();
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
    updateUI();
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
    updateUI();
  }
};

// ===== UPDATE UI =====
function updateUI() {
  const authBtn = document.getElementById('navAuth');
  const submitBtn = document.getElementById('navSubmit');
  
  if (Auth.isLoggedIn()) {
    authBtn.textContent = `👤 ${currentUser?.username || 'User'}`;
    authBtn.className = '';
    authBtn.style.color = '#4f46e5';
    if (submitBtn) submitBtn.style.display = 'inline';
  } else {
    authBtn.textContent = 'Login';
    authBtn.className = 'btn-primary';
    authBtn.style.color = '';
    if (submitBtn) submitBtn.style.display = 'none';
  }
}
