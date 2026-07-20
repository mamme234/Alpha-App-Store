// ============================================
// ALPHA APP STORE - COMPLETE JAVASCRIPT
// ============================================

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
            const result = await api.post('/auth/login', { email, password });
            if (result.success) {
                currentUser = result.data.user;
                authToken = result.data.token;
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('✅ Login successful!', 'success');
                updateUI();
                navigateTo('home');
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
            const result = await api.post('/auth/register', { username, email, password });
            if (result.success) {
                currentUser = result.data.user;
                authToken = result.data.token;
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('✅ Registration successful!', 'success');
                updateUI();
                navigateTo('home');
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
            const result = await api.get('/auth/me', authToken);
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
    const authBtn = document.querySelector('.nav-links .btn-primary');
    const submitBtn = document.querySelector('.nav-submit');
    
    if (Auth.isLoggedIn()) {
        authBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser?.username || 'User'}`;
        authBtn.className = '';
        authBtn.style.color = '#4f46e5';
        authBtn.style.background = 'none';
        if (submitBtn) submitBtn.style.display = 'inline';
    } else {
        authBtn.innerHTML = `<i class="fas fa-user"></i> Login`;
        authBtn.className = 'btn-primary';
        authBtn.style.color = '';
        authBtn.style.background = '';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

function handleAuthClick() {
    if (Auth.isLoggedIn()) {
        Auth.logout();
    } else {
        navigateTo('login');
    }
}

// ===== NAVIGATION =====
function navigateTo(page, params = null) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    switch(page) {
        case 'home':
            renderHome(mainContent);
            break;
        case 'login':
            renderLogin(mainContent);
            break;
        case 'register':
            renderRegister(mainContent);
            break;
        case 'submit':
            renderSubmit(mainContent);
            break;
        default:
            renderHome(mainContent);
    }
}

// ===== RENDER HOME =====
function renderHome(container) {
    container.innerHTML = `
        <!-- Hero -->
        <section class="hero">
            <div class="container">
                <h1>📱 Discover Amazing Apps</h1>
                <p>Find the best apps for your Android device. Download safely and securely.</p>
                <div class="hero-buttons">
                    <a href="#" class="btn-primary" onclick="navigateTo('submit')">Submit Your App</a>
                </div>
            </div>
        </section>

        <!-- Categories -->
        <section class="categories">
            <div class="container">
                <h2 class="section-title">📂 Categories</h2>
                <div class="categories-grid">
                    ${['Games','Education','Finance','Social','Tools','Productivity','Health','Music'].map(cat => `
                        <div class="category-card" onclick="showNotification('🔍 ${cat} category', 'info')">
                            <i class="fas fa-${getCategoryIcon(cat)}"></i>
                            <span>${cat}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Featured Apps -->
        <section class="featured-apps">
            <div class="container">
                <h2 class="section-title">⭐ Featured Apps</h2>
                <div class="app-grid" id="appGrid">
                    ${renderAppCards()}
                </div>
            </div>
        </section>
    `;
}

// ===== RENDER APP CARDS =====
function renderAppCards() {
    const apps = [
        { name: 'Alpha Games', desc: 'Best gaming experience', rating: 4.8, downloads: '50K', category: 'Games', color: '4f46e5' },
        { name: 'Learn Pro', desc: 'Learn anything, anywhere', rating: 4.6, downloads: '35K', category: 'Education', color: '7c3aed' },
        { name: 'Finance Tracker', desc: 'Track your expenses', rating: 4.7, downloads: '28K', category: 'Finance', color: '059669' },
        { name: 'Social Connect', desc: 'Connect worldwide', rating: 4.5, downloads: '80K', category: 'Social', color: 'd97706' }
    ];

    return apps.map(app => `
        <div class="app-card">
            <div class="app-header">
                <img src="https://via.placeholder.com/64/${app.color}/ffffff?text=App" alt="${app.name}" class="app-icon">
                <div class="app-info">
                    <h3 class="app-name">${app.name}</h3>
                    <p class="app-desc">${app.desc}</p>
                    <div class="app-meta">
                        <span class="app-rating">⭐ ${app.rating}</span>
                        <span class="app-downloads">⬇️ ${app.downloads}</span>
                        <span class="app-category">${app.category}</span>
                    </div>
                </div>
            </div>
            <div class="app-actions">
                <button class="btn-download" onclick="handleDownload('${app.name}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn-fav" onclick="handleFavorite(this)">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ===== RENDER LOGIN =====
function renderLogin(container) {
    if (Auth.isLoggedIn()) {
        navigateTo('home');
        return;
    }
    
    container.innerHTML = `
        <div class="auth-form">
            <h2>👋 Welcome Back</h2>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-submit">Login</button>
            </form>
            <div class="auth-link">
                Don't have an account? <a href="#" onclick="navigateTo('register')">Sign Up</a>
            </div>
        </div>
    `;
}

// ===== RENDER REGISTER =====
function renderRegister(container) {
    if (Auth.isLoggedIn()) {
        navigateTo('home');
        return;
    }
    
    container.innerHTML = `
        <div class="auth-form">
            <h2>📝 Create Account</h2>
            <form onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="regUsername" required placeholder="username">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="regEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="regPassword" required placeholder="••••••••" minlength="6">
                </div>
                <button type="submit" class="btn-submit">Sign Up</button>
            </form>
            <div class="auth-link">
                Already have an account? <a href="#" onclick="navigateTo('login')">Login</a>
            </div>
        </div>
    `;
}

// ===== RENDER SUBMIT =====
function renderSubmit(container) {
    if (!Auth.isLoggedIn()) {
        container.innerHTML = `
            <div class="auth-form">
                <h2>🔐 Please Login</h2>
                <p style="text-align:center;margin-bottom:20px;">You need to be logged in to submit an app.</p>
                <button onclick="navigateTo('login')" class="btn-submit">Login</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="auth-form">
            <h2>📤 Submit Your App</h2>
            <p style="text-align:center;color:#6b7280;margin-bottom:20px;">Add your app to the store</p>
            
            <form onsubmit="handleSubmitApp(event)">
                <div class="form-group">
                    <label>App Name *</label>
                    <input type="text" id="appName" required placeholder="My Awesome App">
                </div>
                
                <div class="form-group">
                    <label>Package Name *</label>
                    <input type="text" id="packageName" required placeholder="com.example.app">
                </div>
                
                <div class="form-group">
                    <label>Category *</label>
                    <select id="appCategory" required>
                        <option value="games">🎮 Games</option>
                        <option value="education">📚 Education</option>
                        <option value="finance">💰 Finance</option>
                        <option value="social">👥 Social</option>
                        <option value="tools">🔧 Tools</option>
                        <option value="productivity">📊 Productivity</option>
                        <option value="health">💪 Health</option>
                        <option value="music">🎵 Music</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Short Description *</label>
                    <input type="text" id="shortDesc" required placeholder="Brief description (max 160 chars)">
                </div>
                
                <div class="form-group">
                    <label>Full Description</label>
                    <textarea id="appDesc" rows="4" placeholder="Detailed description of your app"></textarea>
                </div>
                
                <div class="form-group">
                    <label>🔗 Deployment Links (Optional)</label>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <input type="url" id="vercelLink" placeholder="Vercel URL">
                        <input type="url" id="renderLink" placeholder="Render URL">
                        <input type="url" id="netlifyLink" placeholder="Netlify URL">
                        <input type="url" id="githubLink" placeholder="GitHub URL">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Features (comma separated)</label>
                    <input type="text" id="appFeatures" placeholder="Fast, Secure, User-friendly">
                </div>
                
                <button type="submit" class="btn-submit">🚀 Submit App</button>
            </form>
        </div>
    `;
}

// ===== HANDLERS =====
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await Auth.login(email, password);
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    await Auth.register(username, email, password);
}

async function handleSubmitApp(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('appName').value,
        packageName: document.getElementById('packageName').value,
        category: document.getElementById('appCategory').value,
        shortDescription: document.getElementById('shortDesc').value,
        description: document.getElementById('appDesc').value || 'No description',
        features: document.getElementById('appFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        deployment: {
            vercel: document.getElementById('vercelLink').value || '',
            render: document.getElementById('renderLink').value || '',
            netlify: document.getElementById('netlifyLink').value || '',
            github: document.getElementById('githubLink').value || ''
        }
    };

    try {
        const result = await api.post('/apps/submit', data, authToken);
        if (result.success) {
            showNotification('✅ App submitted successfully!', 'success');
            navigateTo('home');
        } else {
            showNotification(result.message || 'Submission failed', 'error');
        }
    } catch (error) {
        showNotification('Submission failed', 'error');
    }
}

function handleDownload(appName) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to download', 'error');
        navigateTo('login');
        return;
    }
    showNotification(`📥 Downloading ${appName}...`, 'success');
}

function handleFavorite(btn) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to favorite', 'error');
        navigateTo('login');
        return;
    }
    btn.classList.toggle('active');
    showNotification('❤️ Updated favorites', 'success');
}

// ===== UTILITY FUNCTIONS =====
function getCategoryIcon(category) {
    const icons = {
        'Games': 'gamepad',
        'Education': 'graduation-cap',
        'Finance': 'coins',
        'Social': 'users',
        'Tools': 'tools',
        'Productivity': 'chart-line',
        'Health': 'heartbeat',
        'Music': 'music'
    };
    return icons[category] || 'cube';
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 3000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    Auth.loadUser();
    
    // Setup main content
    const mainContent = document.createElement('main');
    mainContent.className = 'container';
    mainContent.id = 'mainContent';
    document.querySelector('body').insertBefore(mainContent, document.querySelector('footer'));
    
    navigateTo('home');
    
    // Search
    document.querySelector('.nav-search button')?.addEventListener('click', () => {
        const query = document.querySelector('.nav-search input').value.trim();
        if (query) showNotification(`🔍 Searching for "${query}"`, 'info');
    });
    
    document.querySelector('.nav-search input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) showNotification(`🔍 Searching for "${query}"`, 'info');
        }
    });
});

console.log('✅ Alpha App Store loaded!');
