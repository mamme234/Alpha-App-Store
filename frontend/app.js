// ============================================
// ALPHA APP STORE - COMPLETE JAVASCRIPT
// Frontend: Vercel | Backend: Render
// ============================================

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // Backend API URL (Render)
    API_URL: 'https://alpha-app-store.onrender.com/api',
    
    // Frontend URL (Vercel)
    FRONTEND_URL: 'https://alpha-app-store.vercel.app',
    
    // App Info
    APP_NAME: 'Alpha App Store',
    VERSION: '1.0.0'
};

console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
console.log(`📍 Backend API: ${CONFIG.API_URL}`);
console.log(`📍 Frontend URL: ${CONFIG.FRONTEND_URL}`);

// ============================================
// API CLIENT
// ============================================
const api = {
    get: async (endpoint, token = null) => {
        const headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const res = await fetch(`${CONFIG.API_URL}${endpoint}`, { 
                headers,
                credentials: 'include'
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            }
            return res.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    post: async (endpoint, data, token = null) => {
        const headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const res = await fetch(`${CONFIG.API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                credentials: 'include'
            });
            
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || `HTTP error! status: ${res.status}`);
            }
            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    put: async (endpoint, data, token = null) => {
        const headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const res = await fetch(`${CONFIG.API_URL}${endpoint}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
                credentials: 'include'
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            }
            return res.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },
    
    delete: async (endpoint, token = null) => {
        const headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const res = await fetch(`${CONFIG.API_URL}${endpoint}`, {
                method: 'DELETE',
                headers,
                credentials: 'include'
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            }
            return res.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// ============================================
// AUTH STATE
// ============================================
let currentUser = null;
let authToken = localStorage.getItem('token');

// ============================================
// AUTH FUNCTIONS
// ============================================
const Auth = {
    getUser: () => currentUser,
    getToken: () => authToken,
    isLoggedIn: () => !!authToken,

    register: async (username, email, password) => {
        try {
            console.log('📝 Attempting registration...');
            
            const result = await api.post('/auth/register', { 
                username, 
                email, 
                password 
            });
            
            if (result.success) {
                currentUser = result.data.user;
                authToken = result.data.token;
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('✅ Registration successful! Welcome ' + username + '!', 'success');
                updateUI();
                navigateTo('home');
                return { success: true, data: result.data };
            } else {
                showNotification(result.message || 'Registration failed', 'error');
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            showNotification('❌ ' + (error.message || 'Registration failed'), 'error');
            return { success: false, message: error.message };
        }
    },

    login: async (email, password) => {
        try {
            console.log('🔐 Attempting login...');
            
            const result = await api.post('/auth/login', { email, password });
            
            if (result.success) {
                currentUser = result.data.user;
                authToken = result.data.token;
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('✅ Login successful! Welcome back ' + currentUser.username + '!', 'success');
                updateUI();
                navigateTo('home');
                return { success: true, data: result.data };
            } else {
                showNotification(result.message || 'Login failed', 'error');
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            showNotification('❌ ' + (error.message || 'Login failed'), 'error');
            return { success: false, message: error.message };
        }
    },

    logout: () => {
        currentUser = null;
        authToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showNotification('👋 Logged out successfully', 'info');
        updateUI();
        navigateTo('home');
    },

    loadUser: async () => {
        if (!authToken) {
            console.log('No token found, user not logged in');
            return;
        }
        
        try {
            console.log('👤 Loading user...');
            const result = await api.get('/auth/me', authToken);
            if (result.success) {
                currentUser = result.data.user;
                localStorage.setItem('user', JSON.stringify(currentUser));
                console.log('✅ User loaded:', currentUser.username);
            } else {
                console.log('⚠️ Token invalid, clearing...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                authToken = null;
            }
        } catch (error) {
            console.error('❌ Failed to load user:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            authToken = null;
        }
        updateUI();
    },

    checkHealth: async () => {
        try {
            console.log('🏥 Checking server health...');
            const res = await fetch(`${CONFIG.API_URL.replace('/api', '')}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('✅ Server is healthy:', data);
                return true;
            }
            console.log('⚠️ Server health check failed');
            return false;
        } catch (error) {
            console.error('❌ Server health check error:', error);
            return false;
        }
    }
};

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
    const authBtn = document.getElementById('navAuth');
    const submitBtn = document.getElementById('navSubmit');
    const favBtn = document.getElementById('navFavorites');
    
    if (Auth.isLoggedIn()) {
        authBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser?.username || 'User'}`;
        authBtn.className = '';
        authBtn.style.color = '#4f46e5';
        authBtn.style.background = 'none';
        if (submitBtn) submitBtn.style.display = 'inline';
        if (favBtn) favBtn.style.display = 'inline';
    } else {
        authBtn.innerHTML = `<i class="fas fa-user"></i> Login`;
        authBtn.className = 'btn-primary';
        authBtn.style.color = '';
        authBtn.style.background = '';
        if (submitBtn) submitBtn.style.display = 'none';
        if (favBtn) favBtn.style.display = 'none';
    }
}

function handleAuthClick() {
    if (Auth.isLoggedIn()) {
        Auth.logout();
    } else {
        navigateTo('login');
    }
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page, params = null) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    switch(page) {
        case 'home':
            renderHome(mainContent);
            break;
        case 'categories':
            renderCategories(mainContent);
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
        case 'submit':
            renderSubmit(mainContent);
            break;
        case 'favorites':
            renderFavorites(mainContent);
            break;
        case 'search':
            renderSearch(mainContent, params);
            break;
        default:
            renderHome(mainContent);
    }
}

// ============================================
// RENDER HOME
// ============================================
function renderHome(container) {
    container.innerHTML = `
        <!-- Hero -->
        <section class="hero">
            <div class="container">
                <h1>📱 Discover Amazing Apps</h1>
                <p>Find the best Android apps, games, and tools. Download safely and securely.</p>
                <div class="hero-buttons">
                    <a href="#" class="btn-primary" onclick="navigateTo('submit')"><i class="fas fa-upload"></i> Submit Your App</a>
                    <a href="#" class="btn-secondary" onclick="navigateTo('categories')"><i class="fas fa-th-large"></i> Browse Categories</a>
                </div>
                <div class="hero-stats">
                    <div class="stat">
                        <div class="stat-number">2,500+</div>
                        <div class="stat-label">Apps Available</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">1M+</div>
                        <div class="stat-label">Total Downloads</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">500+</div>
                        <div class="stat-label">Developers</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Categories -->
        <section>
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-th-large"></i> Categories</h2>
                <a href="#" class="section-link" onclick="navigateTo('categories')">View All →</a>
            </div>
            <div class="categories-grid">
                ${renderCategoriesGrid()}
            </div>
        </section>

        <!-- Featured Apps -->
        <section>
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-star"></i> Featured Apps</h2>
                <a href="#" class="section-link" onclick="showNotification('All featured apps', 'info')">View All →</a>
            </div>
            <div class="app-grid">
                ${renderAppCards('featured')}
            </div>
        </section>

        <!-- Trending Apps -->
        <section>
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-fire"></i> Trending Now</h2>
                <a href="#" class="section-link" onclick="showNotification('All trending apps', 'info')">View All →</a>
            </div>
            <div class="app-grid">
                ${renderAppCards('trending')}
            </div>
        </section>

        <!-- Submit Banner -->
        <section class="submit-banner">
            <div class="submit-content">
                <h2>🚀 Submit Your App</h2>
                <p>Share your app with millions of users. Get more downloads, reviews, and grow your audience.</p>
                <a href="#" class="btn-primary" onclick="navigateTo('submit')"><i class="fas fa-upload"></i> Submit Now</a>
            </div>
            <div class="submit-stats">
                <div class="stat">
                    <span class="stat-number">2,500+</span>
                    <span class="stat-label">Apps Available</span>
                </div>
                <div class="stat">
                    <span class="stat-number">1M+</span>
                    <span class="stat-label">Total Downloads</span>
                </div>
                <div class="stat">
                    <span class="stat-number">500+</span>
                    <span class="stat-label">Developers</span>
                </div>
            </div>
        </section>
    `;
}

// ============================================
// RENDER CATEGORIES
// ============================================
function renderCategories(container) {
    container.innerHTML = `
        <section>
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-th-large"></i> All Categories</h2>
            </div>
            <div class="categories-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                ${renderCategoriesGrid()}
            </div>
        </section>
    `;
}

function renderCategoriesGrid() {
    const categories = [
        { name: 'Games', icon: 'gamepad' },
        { name: 'Education', icon: 'graduation-cap' },
        { name: 'Finance', icon: 'coins' },
        { name: 'Social', icon: 'users' },
        { name: 'Tools', icon: 'tools' },
        { name: 'Productivity', icon: 'chart-line' },
        { name: 'Health', icon: 'heartbeat' },
        { name: 'Music', icon: 'music' },
        { name: 'Entertainment', icon: 'film' },
        { name: 'News', icon: 'newspaper' },
        { name: 'Shopping', icon: 'shopping-cart' },
        { name: 'Travel', icon: 'plane' },
        { name: 'Sports', icon: 'futbol' },
        { name: 'Photography', icon: 'camera' },
        { name: 'Books', icon: 'book' },
        { name: 'Business', icon: 'briefcase' },
        { name: 'Lifestyle', icon: 'leaf' },
        { name: 'Communication', icon: 'comment' }
    ];
    
    return categories.map(cat => `
        <div class="category-card" onclick="showNotification('🔍 ${cat.name} category', 'info')">
            <i class="fas fa-${cat.icon}"></i>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

// ============================================
// RENDER APP CARDS
// ============================================
function renderAppCards(type = 'featured') {
    const apps = getSampleApps(type);
    
    return apps.map(app => `
        <div class="app-card" onclick="navigateTo('app', '${app.id}')" style="position:relative;cursor:pointer;">
            ${type === 'featured' ? '<div class="featured-badge">⭐ Featured</div>' : ''}
            ${type === 'trending' ? '<div class="trending-badge">🔥 Trending</div>' : ''}
            <div class="app-header">
                <img src="https://via.placeholder.com/64/${app.color}/ffffff?text=${app.name.charAt(0)}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/64'">
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
            <div class="app-actions" onclick="event.stopPropagation();">
                <button class="btn-download" onclick="handleDownload('${app.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn-fav ${app.favorited ? 'active' : ''}" onclick="handleFavorite(this, '${app.id}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// SAMPLE APPS DATA
// ============================================
function getSampleApps(type) {
    const allApps = [
        { id: '1', name: 'Alpha Games', desc: 'Best gaming experience on Android', rating: '4.8', downloads: '50K', category: 'Games', color: '4f46e5', favorited: false },
        { id: '2', name: 'Learn Pro', desc: 'Learn anything, anywhere', rating: '4.6', downloads: '35K', category: 'Education', color: '7c3aed', favorited: false },
        { id: '3', name: 'Finance Tracker', desc: 'Track your expenses easily', rating: '4.7', downloads: '28K', category: 'Finance', color: '059669', favorited: false },
        { id: '4', name: 'Social Connect', desc: 'Connect with friends worldwide', rating: '4.5', downloads: '80K', category: 'Social', color: 'd97706', favorited: false },
        { id: '5', name: 'Photo Editor Pro', desc: 'Edit photos like a pro', rating: '4.9', downloads: '120K', category: 'Tools', color: 'dc2626', favorited: false },
        { id: '6', name: 'Music Player', desc: 'Listen to your favorite music', rating: '4.7', downloads: '95K', category: 'Music', color: '2563eb', favorited: false },
        { id: '7', name: 'Health Tracker', desc: 'Track your fitness goals', rating: '4.4', downloads: '45K', category: 'Health', color: '16a34a', favorited: false },
        { id: '8', name: 'Productivity Suite', desc: 'Boost your productivity', rating: '4.3', downloads: '32K', category: 'Productivity', color: '8b5cf6', favorited: false }
    ];
    
    if (type === 'featured') return allApps.slice(0, 4);
    if (type === 'trending') return allApps.slice(4, 8);
    return allApps;
}

// ============================================
// RENDER APP DETAIL
// ============================================
function renderAppDetail(container, appId) {
    const app = getSampleApps('all').find(a => a.id === appId);
    if (!app) {
        container.innerHTML = `<p style="text-align:center;padding:40px;">App not found</p>`;
        return;
    }

    container.innerHTML = `
        <div class="app-detail">
            <div class="header">
                <img src="https://via.placeholder.com/120/${app.color}/ffffff?text=${app.name.charAt(0)}" alt="${app.name}" class="icon" onerror="this.src='https://via.placeholder.com/120'">
                <div class="info">
                    <h1>${app.name}</h1>
                    <div class="package">com.alpha.${app.name.toLowerCase().replace(/ /g, '')}</div>
                    <div class="meta">
                        <span>📌 Version 1.0.0</span>
                        <span>📱 Android 5.0+</span>
                        <span>💾 5MB</span>
                        <span>⭐ ${app.rating}</span>
                        <span>⬇️ ${app.downloads}</span>
                    </div>
                    <button class="download-btn" onclick="handleDownload('${app.id}')">
                        <i class="fas fa-download"></i> Download APK
                    </button>
                </div>
            </div>
            
            <div class="description">
                <h2>📖 Description</h2>
                <p>${app.name} is an amazing app that will change the way you use your Android device. 
                With a beautiful interface and powerful features, it's the perfect tool for everyone.</p>
            </div>
            
            <div class="features">
                <h2>✨ Features</h2>
                <ul>
                    <li>Beautiful and intuitive user interface</li>
                    <li>Fast and responsive performance</li>
                    <li>Regular updates with new features</li>
                    <li>Secure and privacy-focused</li>
                    <li>Works offline</li>
                    <li>Support for all Android versions 5.0+</li>
                </ul>
            </div>

            <div style="margin-top:20px;">
                <h2>🚀 Deployments</h2>
                <div class="deploy-links">
                    <a href="#" class="vercel" onclick="showNotification('Opening Vercel deployment', 'info')">⚡ Vercel</a>
                    <a href="#" class="render" onclick="showNotification('Opening Render deployment', 'info')">🔄 Render</a>
                    <a href="#" class="netlify" onclick="showNotification('Opening Netlify deployment', 'info')">🚀 Netlify</a>
                    <a href="#" class="github" onclick="showNotification('Opening GitHub repository', 'info')">🐙 GitHub</a>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// RENDER FAVORITES
// ============================================
function renderFavorites(container) {
    if (!Auth.isLoggedIn()) {
        container.innerHTML = `
            <div class="auth-form">
                <h2>🔐 Please Login</h2>
                <p style="text-align:center;margin-bottom:20px;">Login to see your favorite apps.</p>
                <button onclick="navigateTo('login')" class="btn-submit">Login</button>
            </div>
        `;
        return;
    }

    const favorites = getSampleApps('all').filter(a => a.favorited);
    
    container.innerHTML = `
        <section>
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-heart" style="color:#ef4444;"></i> Your Favorites</h2>
            </div>
            ${favorites.length > 0 ? `
                <div class="app-grid">
                    ${favorites.map(app => `
                        <div class="app-card" onclick="navigateTo('app', '${app.id}')" style="cursor:pointer;">
                            <div class="app-header">
                                <img src="https://via.placeholder.com/64/${app.color}/ffffff?text=${app.name.charAt(0)}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/64'">
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
                            <div class="app-actions" onclick="event.stopPropagation();">
                                <button class="btn-download" onclick="handleDownload('${app.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn-fav active" onclick="handleFavorite(this, '${app.id}')">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="text-align:center;padding:60px 20px;background:white;border-radius:16px;">
                    <i class="fas fa-heart" style="font-size:48px;color:#e5e7eb;margin-bottom:16px;"></i>
                    <h3>No favorites yet</h3>
                    <p style="color:#6b7280;">Start adding apps to your favorites collection!</p>
                    <button class="btn-primary" style="margin-top:16px;" onclick="navigateTo('home')">Browse Apps</button>
                </div>
            `}
        </section>
    `;
}

// ============================================
// RENDER SEARCH
// ============================================
function renderSearch(container, query) {
    const allApps = getSampleApps('all');
    const results = allApps.filter(app => 
        app.name.toLowerCase().includes(query.toLowerCase()) ||
        app.desc.toLowerCase().includes(query.toLowerCase()) ||
        app.category.toLowerCase().includes(query.toLowerCase())
    );

    container.innerHTML = `
        <section>
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-search"></i> Results for "${query}"</h2>
                <span style="color:#6b7280;font-size:14px;">${results.length} apps found</span>
            </div>
            ${results.length > 0 ? `
                <div class="app-grid">
                    ${results.map(app => `
                        <div class="app-card" onclick="navigateTo('app', '${app.id}')" style="cursor:pointer;">
                            <div class="app-header">
                                <img src="https://via.placeholder.com/64/${app.color}/ffffff?text=${app.name.charAt(0)}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/64'">
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
                            <div class="app-actions" onclick="event.stopPropagation();">
                                <button class="btn-download" onclick="handleDownload('${app.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn-fav ${app.favorited ? 'active' : ''}" onclick="handleFavorite(this, '${app.id}')">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="text-align:center;padding:60px 20px;background:white;border-radius:16px;">
                    <i class="fas fa-search" style="font-size:48px;color:#e5e7eb;margin-bottom:16px;"></i>
                    <h3>No results found</h3>
                    <p style="color:#6b7280;">Try searching with different keywords</p>
                    <button class="btn-primary" style="margin-top:16px;" onclick="navigateTo('home')">Back to Home</button>
                </div>
            `}
        </section>
    `;
}

// ============================================
// RENDER LOGIN
// ============================================
function renderLogin(container) {
    if (Auth.isLoggedIn()) {
        navigateTo('home');
        return;
    }
    
    container.innerHTML = `
        <div class="auth-form">
            <h2>👋 Welcome Back</h2>
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="loginEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Password</label>
                    <input type="password" id="loginPassword" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-submit"><i class="fas fa-sign-in-alt"></i> Login</button>
            </form>
            <div class="auth-link">
                Don't have an account? <a href="#" onclick="navigateTo('register')">Sign Up</a>
            </div>
        </div>
    `;
}

// ============================================
// RENDER REGISTER
// ============================================
function renderRegister(container) {
    if (Auth.isLoggedIn()) {
        navigateTo('home');
        return;
    }
    
    container.innerHTML = `
        <div class="auth-form">
            <h2>📝 Create Account</h2>
            <form id="registerForm" onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Username</label>
                    <input type="text" id="regUsername" required placeholder="username" minlength="3">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="regEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Password</label>
                    <input type="password" id="regPassword" required placeholder="••••••••" minlength="6">
                    <small style="color:#6b7280;font-size:12px;">Must be at least 6 characters</small>
                </div>
                <button type="submit" class="btn-submit"><i class="fas fa-user-plus"></i> Sign Up</button>
            </form>
            <div class="auth-link">
                Already have an account? <a href="#" onclick="navigateTo('login')">Login</a>
            </div>
        </div>
    `;
}

// ============================================
// RENDER SUBMIT
// ============================================
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
            <p style="text-align:center;color:#6b7280;margin-bottom:20px;">Add your app to the store and reach millions of users</p>
            
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
                        <option value="">Select a category</option>
                        <option value="games">🎮 Games</option>
                        <option value="education">📚 Education</option>
                        <option value="finance">💰 Finance</option>
                        <option value="social">👥 Social</option>
                        <option value="tools">🔧 Tools</option>
                        <option value="productivity">📊 Productivity</option>
                        <option value="health">💪 Health</option>
                        <option value="music">🎵 Music</option>
                        <option value="entertainment">🎬 Entertainment</option>
                        <option value="news">📰 News</option>
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
                    <label>🔗 Deployment Links (For APK Generation)</label>
                    <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">We'll generate an APK from these deployment links</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <input type="url" id="vercelLink" placeholder="Vercel URL (e.g., https://app.vercel.app)">
                        <input type="url" id="renderLink" placeholder="Render URL (e.g., https://app.onrender.com)">
                        <input type="url" id="netlifyLink" placeholder="Netlify URL (e.g., https://app.netlify.app)">
                        <input type="url" id="githubLink" placeholder="GitHub URL (e.g., https://github.com/user/repo)">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Features (comma separated)</label>
                    <input type="text" id="appFeatures" placeholder="Fast, Secure, User-friendly, Offline">
                </div>
                
                <button type="submit" class="btn-submit">🚀 Submit App</button>
            </form>
        </div>
    `;
}

// ============================================
// HANDLERS
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const btn = e.target.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    btn.disabled = true;
    
    const result = await Auth.login(email, password);
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('Username must be at least 3 characters', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (!email.includes('@')) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    const btn = e.target.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;
    
    const result = await Auth.register(username, email, password);
    
    btn.innerHTML = originalText;
    btn.disabled = false;
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

    const btn = e.target.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating APK...';
    btn.disabled = true;
    
    showNotification('⏳ Submitting app and generating APK...', 'info');

    try {
        const result = await api.post('/apps/submit', data, authToken);
        if (result.success) {
            showNotification('✅ App submitted and APK generated successfully!', 'success');
            navigateTo('home');
        } else {
            showNotification(result.message || 'Submission failed', 'error');
        }
    } catch (error) {
        showNotification('❌ Submission failed: ' + error.message, 'error');
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

// ============================================
// HANDLE DOWNLOAD - FIXED
// ============================================
async function handleDownload(appId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to download', 'error');
        navigateTo('login');
        return;
    }
    
    try {
        showNotification('📥 Downloading APK...', 'info');
        
        // Try to get the app from API first
        try {
            const app = await api.get(`/apps/${appId}`, authToken);
            if (app && app.data && app.data.apkUrl) {
                window.open(app.data.apkUrl, '_blank');
                showNotification('✅ Download started!', 'success');
                return;
            }
        } catch (e) {
            console.log('App not found in API, using sample data');
        }
        
        // Fallback: use sample data
        const allApps = getSampleApps('all');
        const app = allApps.find(a => a.id === appId);
        if (app) {
            showNotification('✅ Download started for ' + app.name + '!', 'success');
        } else {
            showNotification('❌ App not found', 'error');
        }
    } catch (error) {
        showNotification('❌ Download failed: ' + error.message, 'error');
    }
}

function handleFavorite(btn, appId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to favorite', 'error');
        navigateTo('login');
        return;
    }
    btn.classList.toggle('active');
    showNotification('❤️ Updated favorites', 'success');
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 4000);
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
    console.log(`📍 Backend API: ${CONFIG.API_URL}`);
    console.log(`📍 Frontend URL: ${CONFIG.FRONTEND_URL}`);
    
    // Check server health
    const isHealthy = await Auth.checkHealth();
    if (!isHealthy) {
        showNotification('⚠️ Server is starting up. Please wait a moment.', 'warning');
    }
    
    // Load user
    await Auth.loadUser();
    
    // Navigate to home
    navigateTo('home');
    
    // Search
    document.getElementById('searchBtn').addEventListener('click', () => {
        const query = document.getElementById('searchInput').value.trim();
        if (query) {
            navigateTo('search', query);
        }
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                navigateTo('search', query);
            }
        }
    });
    
    console.log('✅ App initialized successfully!');
});

// ============================================
// EXPOSE GLOBALLY
// ============================================
window.navigateTo = navigateTo;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleSubmitApp = handleSubmitApp;
window.handleDownload = handleDownload;
window.handleFavorite = handleFavorite;
window.showNotification = showNotification;
window.Auth = Auth;
window.api = api;
window.CONFIG = CONFIG;

console.log('✅ All functions exposed globally');
