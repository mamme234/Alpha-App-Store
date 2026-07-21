// ============================================
// APK STORE - COMPLETE PREMIUM FRONTEND
// ============================================

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_URL: 'https://alpha-app-store.onrender.com/api',
    FRONTEND_URL: 'https://alpha-app-store.vercel.app',
    APP_NAME: 'APK Store',
    VERSION: '2.0.0'
};

console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
console.log(`📍 Backend: ${CONFIG.API_URL}`);

// ============================================
// STATE
// ============================================
let currentUser = null;
let authToken = localStorage.getItem('token');
let currentPage = 'home';
let theme = localStorage.getItem('theme') || 'dark';

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
            const url = `${CONFIG.API_URL}${endpoint}`;
            console.log(`📡 GET: ${url}`);
            const res = await fetch(url, { 
                headers, 
                credentials: 'include',
                mode: 'cors'
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${res.status}`);
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
            const url = `${CONFIG.API_URL}${endpoint}`;
            console.log(`📡 POST: ${url}`);
            console.log(`📦 Data:`, data);
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                credentials: 'include',
                mode: 'cors'
            });
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || `HTTP ${res.status}`);
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
            const url = `${CONFIG.API_URL}${endpoint}`;
            console.log(`📡 PUT: ${url}`);
            const res = await fetch(url, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
                credentials: 'include',
                mode: 'cors'
            });
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || `HTTP ${res.status}`);
            }
            return result;
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
            const url = `${CONFIG.API_URL}${endpoint}`;
            console.log(`📡 DELETE: ${url}`);
            const res = await fetch(url, {
                method: 'DELETE',
                headers,
                credentials: 'include',
                mode: 'cors'
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${res.status}`);
            }
            return res.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// ============================================
// AUTH SYSTEM - SIMPLIFIED (Email only for login)
// ============================================
const Auth = {
    getUser: () => currentUser,
    getToken: () => authToken,
    isLoggedIn: () => !!authToken,

    // ✅ LOGIN - uses /auth/login (email + password only)
    login: async (email, password) => {
        try {
            console.log('🔐 Attempting login...');
            const result = await api.post('/auth/login', { email, password });
            if (result.success) {
                currentUser = result.data.user;
                authToken = result.data.token;
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('✅ Welcome back, ' + currentUser.username + '!', 'success');
                updateUI();
                navigate('home');
                return { success: true };
            }
            showNotification(result.message || 'Login failed', 'error');
            return { success: false };
        } catch (error) {
            console.error('Login error:', error);
            showNotification('❌ Login failed: ' + error.message, 'error');
            return { success: false };
        }
    },

    // ✅ REGISTER - uses /auth/register (username + email + password)
    register: async (username, email, password, role = 'user') => {
        try {
            console.log('📝 Attempting registration...');
            const result = await api.post('/auth/register', { 
                username, 
                email, 
                password, 
                role 
            });
            if (result.success) {
                currentUser = result.data.user;
                authToken = result.data.token;
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('✅ Welcome, ' + username + '!', 'success');
                updateUI();
                navigate('home');
                return { success: true };
            }
            showNotification(result.message || 'Registration failed', 'error');
            return { success: false };
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('❌ Registration failed: ' + error.message, 'error');
            return { success: false };
        }
    },

    logout: () => {
        currentUser = null;
        authToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showNotification('👋 Logged out successfully', 'info');
        updateUI();
        navigate('home');
    },

    loadUser: async () => {
        if (!authToken) return;
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
            console.error('Failed to load user:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            authToken = null;
        }
        updateUI();
    },

    checkHealth: async () => {
        try {
            const baseUrl = CONFIG.API_URL.replace('/api', '');
            console.log(`🏥 Checking health at: ${baseUrl}/health`);
            const res = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });
            if (res.ok) {
                const data = await res.json();
                console.log('✅ Server is healthy:', data);
                return true;
            }
            console.log('⚠️ Health check failed with status:', res.status);
            return false;
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return false;
        }
    }
};

// ============================================
// THEME
// ============================================
function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function loadTheme() {
    document.documentElement.setAttribute('data-theme', theme);
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
    const authBtn = document.getElementById('navAuth');
    const devBtn = document.getElementById('navDeveloper');
    const adminBtn = document.getElementById('navAdmin');
    const favBtn = document.getElementById('navFavorites');

    if (Auth.isLoggedIn() && currentUser) {
        authBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.username}`;
        authBtn.className = '';
        authBtn.style.color = 'var(--primary)';
        authBtn.style.background = 'none';
        authBtn.onclick = () => navigate('profile');

        if (currentUser.role === 'developer' || currentUser.role === 'admin') {
            if (devBtn) devBtn.style.display = 'inline';
        }
        if (currentUser.role === 'admin') {
            if (adminBtn) adminBtn.style.display = 'inline';
        }
        if (favBtn) favBtn.style.display = 'inline';
    } else {
        authBtn.innerHTML = `<i class="fas fa-user"></i> Login`;
        authBtn.className = 'btn-primary';
        authBtn.style.color = '';
        authBtn.style.background = '';
        authBtn.onclick = () => handleAuth();
        if (devBtn) devBtn.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
        if (favBtn) favBtn.style.display = 'none';
    }
}

function handleAuth() {
    if (Auth.isLoggedIn()) {
        Auth.logout();
    } else {
        navigate('login');
    }
}

// ============================================
// NOTIFICATIONS
// ============================================
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
        if (div.parentNode) div.remove();
    }, 4000);
}

// ============================================
// NAVIGATION
// ============================================
function navigate(page, params = null) {
    currentPage = page;
    const main = document.getElementById('mainContent');
    if (!main) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update nav links
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    const navMap = {
        'home': '.nav-links a[onclick*="home"]',
        'categories': '.nav-links a[onclick*="categories"]',
        'favorites': '#navFavorites',
        'developer': '#navDeveloper',
        'admin': '#navAdmin'
    };
    const selector = navMap[page];
    if (selector) {
        const el = document.querySelector(selector);
        if (el) el.classList.add('active');
    }

    switch (page) {
        case 'home': renderHome(main); break;
        case 'categories': renderCategories(main); break;
        case 'app': renderAppDetail(main, params); break;
        case 'login': renderLogin(main); break;
        case 'register': renderRegister(main); break;
        case 'submit': renderSubmit(main); break;
        case 'favorites': renderFavorites(main); break;
        case 'developer': renderDeveloperDashboard(main); break;
        case 'admin': renderAdminPanel(main); break;
        case 'profile': renderProfile(main); break;
        default: renderHome(main);
    }
}

// ============================================
// RENDER HOME
// ============================================
async function renderHome(container) {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading amazing apps...</p>
        </div>
    `;

    try {
        const [featured, trending, latest, topDownloads, categories] = await Promise.all([
            api.get('/apps/featured').catch(() => ({ data: [] })),
            api.get('/apps/trending').catch(() => ({ data: [] })),
            api.get('/apps/latest').catch(() => ({ data: [] })),
            api.get('/apps/top-downloads').catch(() => ({ data: [] })),
            api.get('/categories').catch(() => ({ data: [] }))
        ]);

        const allApps = [...featured.data, ...trending.data, ...latest.data];
        const uniqueApps = allApps.filter((app, index, self) =>
            self.findIndex(a => a._id === app._id) === index
        );

        container.innerHTML = `
            <!-- Hero -->
            <section class="hero">
                <div class="container">
                    <h1>Discover <span class="highlight">Amazing</span> Android Apps</h1>
                    <p>Find the best Android apps, games, and tools. Download safely and securely with one click.</p>
                    <div class="hero-buttons">
                        <a href="#" class="btn-primary" onclick="navigate('submit')"><i class="fas fa-upload"></i> Submit Your App</a>
                        <a href="#" class="btn-secondary" onclick="navigate('categories')"><i class="fas fa-th-large"></i> Browse Categories</a>
                    </div>
                    <div class="hero-stats">
                        <div class="stat">
                            <span class="stat-number">${uniqueApps.length}+</span>
                            <span class="stat-label">Apps Available</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${uniqueApps.reduce((sum, app) => sum + (app.downloads || 0), 0).toLocaleString()}</span>
                            <span class="stat-label">Total Downloads</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${new Set(uniqueApps.map(a => a.developer?._id)).size}+</span>
                            <span class="stat-label">Developers</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Categories -->
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-th-large"></i> Categories</h2>
                    <a href="#" class="section-link" onclick="navigate('categories')">View All →</a>
                </div>
                <div class="categories-grid">
                    ${categories.data && categories.data.length > 0
                        ? categories.data.slice(0, 10).map(cat => `
                            <div class="category-card" onclick="filterByCategory('${cat.slug}')">
                                <i>${cat.icon || '📁'}</i>
                                <span>${cat.name}</span>
                            </div>
                        `).join('')
                        : ['Games', 'Education', 'Finance', 'Social', 'Tools', 'Productivity', 'Health', 'Music', 'Entertainment', 'News']
                            .map(cat => `
                                <div class="category-card" onclick="filterByCategory('${cat.toLowerCase()}')">
                                    <i>${getCategoryIcon(cat)}</i>
                                    <span>${cat}</span>
                                </div>
                            `).join('')
                    }
                </div>
            </section>

            <!-- Latest Apps -->
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-clock" style="color:#10B981;"></i> Latest Apps</h2>
                    <span style="font-size:13px;color:var(--text-muted);">${latest.data?.length || 0} new</span>
                </div>
                <div class="app-grid">
                    ${latest.data && latest.data.length > 0
                        ? renderAppCards(latest.data, 'new')
                        : '<p class="text-center text-muted" style="padding:40px;">No apps yet. Be the first to submit!</p>'
                    }
                </div>
            </section>

            <!-- Featured Apps -->
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-star" style="color:#F59E0B;"></i> Featured Apps</h2>
                    <a href="#" class="section-link" onclick="showNotification('All featured apps', 'info')">View All →</a>
                </div>
                <div class="app-grid">
                    ${featured.data && featured.data.length > 0
                        ? renderAppCards(featured.data, 'featured')
                        : '<p class="text-center text-muted" style="padding:40px;">No featured apps yet</p>'
                    }
                </div>
            </section>

            <!-- Trending Apps -->
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-fire" style="color:#EF4444;"></i> Trending Now</h2>
                    <a href="#" class="section-link" onclick="showNotification('All trending apps', 'info')">View All →</a>
                </div>
                <div class="app-grid">
                    ${trending.data && trending.data.length > 0
                        ? renderAppCards(trending.data, 'trending')
                        : '<p class="text-center text-muted" style="padding:40px;">No trending apps yet</p>'
                    }
                </div>
            </section>

            <!-- Submit Banner -->
            <section class="submit-banner">
                <div class="submit-content">
                    <h2>🚀 Submit Your App</h2>
                    <p>Share your app with millions of users. Get more downloads, reviews, and grow your audience.</p>
                    <a href="#" class="btn-primary" onclick="navigate('submit')"><i class="fas fa-upload"></i> Submit Now</a>
                </div>
                <div class="submit-stats">
                    <div class="stat">
                        <span class="stat-number">${uniqueApps.length}+</span>
                        <span class="stat-label">Apps Available</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${uniqueApps.reduce((sum, app) => sum + (app.downloads || 0), 0).toLocaleString()}</span>
                        <span class="stat-label">Total Downloads</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${new Set(uniqueApps.map(a => a.developer?._id)).size}+</span>
                        <span class="stat-label">Developers</span>
                    </div>
                </div>
            </section>
        `;
    } catch (error) {
        console.error('Error loading home:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:var(--danger);"></i>
                <h3 style="margin-top:16px;">Failed to load apps</h3>
                <p style="color:var(--text-muted);">${error.message || 'Please refresh the page or try again later.'}</p>
                <button class="btn-primary" style="margin-top:16px;" onclick="navigate('home')">Retry</button>
            </div>
        `;
    }
}

// ============================================
// RENDER APP CARDS
// ============================================
function renderAppCards(apps, type = '') {
    if (!apps || apps.length === 0) return '';

    return apps.map(app => {
        const isFavorite = Auth.isLoggedIn() && currentUser?.favorites?.includes(app._id);
        const iconUrl = app.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6C3CE1&color=fff&size=64`;
        const isNew = app.createdAt && (new Date() - new Date(app.createdAt)) < 24 * 60 * 60 * 1000;

        let badge = '';
        if (isNew && type !== 'featured' && type !== 'trending') {
            badge = '<span class="badge badge-new">🆕 New</span>';
        } else if (type === 'featured') {
            badge = '<span class="badge badge-featured">⭐ Featured</span>';
        } else if (type === 'trending') {
            badge = '<span class="badge badge-trending">🔥 Trending</span>';
        }

        return `
            <div class="app-card" onclick="navigate('app', '${app.slug || app._id}')">
                ${badge}
                <div class="app-header">
                    <img src="${iconUrl}" alt="${app.name}" class="app-icon" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6C3CE1&color=fff&size=64'">
                    <div class="app-info">
                        <h3 class="app-name">${app.name}</h3>
                        <p class="app-desc">${app.shortDescription || app.description || app.name}</p>
                        <div class="app-meta">
                            <span class="app-rating">⭐ ${app.rating || 0}</span>
                            <span class="app-downloads"><i class="fas fa-download"></i> ${app.downloads || 0}</span>
                            <span class="app-category">${app.category?.name || app.category || 'General'}</span>
                            ${app.fileSize ? `<span class="app-size">💾 ${app.fileSize}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="app-actions" onclick="event.stopPropagation();">
                    <button class="btn-download" onclick="handleDownload('${app.slug || app._id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn-fav ${isFavorite ? 'active' : ''}" onclick="handleFavorite(this, '${app._id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RENDER APP DETAIL
// ============================================
async function renderAppDetail(container, appId) {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading app details...</p>
        </div>
    `;

    try {
        const result = await api.get(`/apps/${appId}`);
        const app = result.data;

        if (!app) {
            container.innerHTML = `<p style="text-align:center;padding:40px;">App not found</p>`;
            return;
        }

        const iconUrl = app.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6C3CE1&color=fff&size=120`;
        const isFavorite = Auth.isLoggedIn() && currentUser?.favorites?.includes(app._id);
        const isGenerated = app.generated || app.status === 'generated' || app.status === 'approved';

        container.innerHTML = `
            <div class="app-detail-container">
                <div class="app-detail">
                    <div class="header">
                        <img src="${iconUrl}" alt="${app.name}" class="icon" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6C3CE1&color=fff&size=120'">
                        <div class="info">
                            <h1>${app.name}</h1>
                            <div class="package">📦 ${app.packageName}</div>
                            <div class="meta">
                                <span>📌 ${app.version || '1.0.0'}</span>
                                <span>📱 Android ${app.minAndroidVersion || '5.0'}+</span>
                                <span>💾 ${app.fileSize || '5MB'}</span>
                                <span class="rating">⭐ ${app.rating || 0}</span>
                                <span>⬇️ ${app.downloads || 0}</span>
                                ${isGenerated ? '<span style="background:var(--primary-gradient);color:white;padding:2px 14px;border-radius:var(--radius-full);font-size:12px;font-weight:600;">✅ APK Generated</span>' : ''}
                            </div>
                            ${isGenerated ? `
                                <button class="download-btn" onclick="handleDownload('${app.slug || app._id}')">
                                    <i class="fas fa-download"></i> Download APK (${app.fileSize || '5MB'})
                                </button>
                            ` : `
                                <div style="margin-top:12px;padding:14px;background:rgba(245,158,11,0.15);border-radius:var(--radius-md);color:var(--warning);border:1px solid rgba(245,158,11,0.2);">
                                    <i class="fas fa-clock"></i> APK is being generated. Please wait...
                                </div>
                            `}
                            <button class="btn-fav ${isFavorite ? 'active' : ''}" onclick="handleFavorite(this, '${app._id}')" style="padding:12px 24px;font-size:14px;margin-top:12px;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;background:${isFavorite ? 'rgba(239,68,68,0.15)' : 'var(--bg-input)'};color:${isFavorite ? 'var(--danger)' : 'var(--text-secondary)'};">
                                <i class="fas fa-heart"></i> ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            </button>
                        </div>
                    </div>

                    <div class="description">
                        <h2>📖 Description</h2>
                        <p>${app.description || 'No description available.'}</p>
                    </div>

                    ${app.features && app.features.length > 0 ? `
                        <div class="features">
                            <h2>✨ Features</h2>
                            <ul>${app.features.map(f => `<li>${f}</li>`).join('')}</ul>
                        </div>
                    ` : ''}

                    ${app.deployment && (app.deployment.vercel || app.deployment.render || app.deployment.netlify || app.deployment.github) ? `
                        <div style="margin-top:24px;">
                            <h2>🚀 Open Online</h2>
                            <div class="deploy-links">
                                ${app.deployment.vercel ? `<a href="${app.deployment.vercel}" target="_blank" class="vercel">⚡ Vercel</a>` : ''}
                                ${app.deployment.render ? `<a href="${app.deployment.render}" target="_blank" class="render">🔄 Render</a>` : ''}
                                ${app.deployment.netlify ? `<a href="${app.deployment.netlify}" target="_blank" class="netlify">🚀 Netlify</a>` : ''}
                                ${app.deployment.github ? `<a href="${app.deployment.github}" target="_blank" class="github">🐙 GitHub</a>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${app.generatedAt ? `
                        <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border-color);font-size:13px;color:var(--text-muted);">
                            🏗️ Generated: ${new Date(app.generatedAt).toLocaleString()}
                        </div>
                    ` : ''}

                    <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border-color);font-size:13px;color:var(--text-muted);display:flex;gap:20px;flex-wrap:wrap;">
                        <span>👤 Developer: ${app.developer?.username || 'Unknown'}</span>
                        <span>📅 Submitted: ${new Date(app.createdAt).toLocaleDateString()}</span>
                        <span>🔄 Status: ${app.status || 'pending'}</span>
                    </div>

                    <!-- Reviews -->
                    <div class="reviews-section">
                        <h2>💬 Reviews (${app.reviews?.length || 0})</h2>
                        ${Auth.isLoggedIn() ? `
                            <form onsubmit="submitReview(event, '${app._id}')" style="margin-bottom:20px;">
                                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;">
                                    <select id="reviewRating" required style="padding:10px 16px;border-radius:var(--radius-md);border:2px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
                                        <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                        <option value="4">⭐⭐⭐⭐ 4</option>
                                        <option value="3">⭐⭐⭐ 3</option>
                                        <option value="2">⭐⭐ 2</option>
                                        <option value="1">⭐ 1</option>
                                    </select>
                                    <input type="text" id="reviewTitle" placeholder="Review title" style="flex:1;min-width:150px;padding:10px 16px;border-radius:var(--radius-md);border:2px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
                                </div>
                                <textarea id="reviewComment" placeholder="Write your review..." rows="3" style="width:100%;padding:12px 16px;border-radius:var(--radius-md);border:2px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);resize:vertical;font-family:var(--font-family);"></textarea>
                                <button type="submit" class="btn-primary" style="margin-top:10px;">Submit Review</button>
                            </form>
                        ` : `
                            <p style="color:var(--text-muted);margin-bottom:16px;">Login to write a review.</p>
                        `}

                        <div id="reviewsList">
                            ${app.reviews && app.reviews.length > 0
                                ? app.reviews.map(review => `
                                    <div class="review-card">
                                        <div class="review-header">
                                            <div class="avatar">${review.user?.username?.[0]?.toUpperCase() || '?'}</div>
                                            <span class="username">${review.user?.username || 'Anonymous'}</span>
                                            <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                                            ${review.title ? `<span style="font-weight:600;">${review.title}</span>` : ''}
                                            <span style="color:var(--text-muted);font-size:12px;">${new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div class="review-comment">${review.comment}</div>
                                    </div>
                                `).join('')
                                : '<p style="color:var(--text-muted);">No reviews yet. Be the first to review!</p>'
                            }
                        </div>
                    </div>

                    <!-- Related Apps -->
                    ${app.related && app.related.length > 0 ? `
                        <div class="related-section">
                            <h2>📱 Related Apps</h2>
                            <div class="related-grid">
                                ${app.related.map(related => `
                                    <div class="related-card" onclick="navigate('app', '${related.slug || related._id}')">
                                        <img src="${related.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(related.name)}&background=6C3CE1&color=fff&size=56`}" alt="${related.name}" class="icon" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(related.name)}&background=6C3CE1&color=fff&size=56'">
                                        <div class="name">${related.name}</div>
                                        <div class="category">${related.category?.name || 'General'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading app:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:var(--danger);"></i>
                <h3 style="margin-top:16px;">Failed to load app</h3>
                <p style="color:var(--text-muted);">${error.message || 'Please try again'}</p>
                <button class="btn-primary" style="margin-top:16px;" onclick="navigate('home')">Back to Home</button>
            </div>
        `;
    }
}

// ============================================
// RENDER CATEGORIES
// ============================================
async function renderCategories(container) {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading categories...</p>
        </div>
    `;

    try {
        const result = await api.get('/categories');
        const categories = result.data || [];

        container.innerHTML = `
            <div style="padding:20px 24px;">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-th-large"></i> All Categories</h2>
                    <span style="font-size:13px;color:var(--text-muted);">${categories.length} categories</span>
                </div>
                <div class="categories-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));">
                    ${categories.map(cat => `
                        <div class="category-card" onclick="filterByCategory('${cat.slug}')">
                            <i>${cat.icon || '📁'}</i>
                            <span>${cat.name}</span>
                            <small style="display:block;font-size:11px;color:var(--text-muted);margin-top:4px;">${cat.appCount || 0} apps</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="text-align:center;padding:40px;">Failed to load categories</p>`;
    }
}

// ============================================
// RENDER LOGIN - Email + Password only
// ============================================
function renderLogin(container) {
    if (Auth.isLoggedIn()) {
        navigate('home');
        return;
    }

    container.innerHTML = `
        <div class="auth-form">
            <h2>👋 Welcome Back</h2>
            <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">Login to access your account and favorites</p>
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
                Don't have an account? <a href="#" onclick="navigate('register')">Sign Up</a>
            </div>
        </div>
    `;
}

// ============================================
// RENDER REGISTER
// ============================================
function renderRegister(container) {
    if (Auth.isLoggedIn()) {
        navigate('home');
        return;
    }

    container.innerHTML = `
        <div class="auth-form">
            <h2>📝 Create Account</h2>
            <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">Join the community and discover amazing apps</p>
            <form id="registerForm" onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Username *</label>
                    <input type="text" id="regUsername" required placeholder="username" minlength="3">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email *</label>
                    <input type="email" id="regEmail" required placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Password *</label>
                    <input type="password" id="regPassword" required placeholder="••••••••" minlength="6">
                    <small style="color:var(--text-muted);font-size:12px;">Must be at least 6 characters</small>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-code"></i> Register as Developer</label>
                    <select id="regRole" style="width:100%;padding:12px 16px;border-radius:var(--radius-md);border:2px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
                        <option value="user">User</option>
                        <option value="developer">Developer</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit"><i class="fas fa-user-plus"></i> Sign Up</button>
            </form>
            <div class="auth-link">
                Already have an account? <a href="#" onclick="navigate('login')">Login</a>
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
                <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">You need to be logged in to submit an app.</p>
                <button onclick="navigate('login')" class="btn-submit">Login</button>
            </div>
        `;
        return;
    }

    if (currentUser?.role !== 'developer' && currentUser?.role !== 'admin') {
        container.innerHTML = `
            <div class="auth-form">
                <h2>⚠️ Developer Access Required</h2>
                <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">You need to be a registered developer to submit apps.</p>
                <button onclick="showNotification('Contact admin to become a developer', 'info')" class="btn-submit">Request Developer Access</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="auth-form">
            <h2>📤 Submit Your App</h2>
            <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">Add your app to the store and reach millions of users</p>

            <div id="generationProgress" style="display:none;margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius-md);border:1px solid var(--border-color);">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span style="font-weight:600;">Generating APK...</span>
                    <span id="progressText">0%</span>
                </div>
                <div style="width:100%;height:8px;background:var(--border-color);border-radius:4px;overflow:hidden;">
                    <div id="progressBar" style="width:0%;height:100%;background:var(--primary-gradient);border-radius:4px;transition:width 0.5s;"></div>
                </div>
                <p id="progressStatus" style="font-size:13px;color:var(--text-muted);margin-top:8px;">Starting generation...</p>
            </div>

            <form id="submitForm" onsubmit="handleSubmitApp(event)">
                <div class="form-group">
                    <label>App Name *</label>
                    <input type="text" id="appName" required placeholder="My Awesome App">
                </div>

                <div class="form-group">
                    <label>Package Name *</label>
                    <input type="text" id="packageName" required placeholder="com.example.app">
                    <small style="color:var(--text-muted);font-size:12px;">Use reverse domain format (e.g., com.yourcompany.appname)</small>
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
                    <input type="text" id="shortDesc" required placeholder="Brief description (max 160 chars)" maxlength="160">
                    <small style="color:var(--text-muted);font-size:12px;" id="charCount">0/160</small>
                </div>

                <div class="form-group">
                    <label>Full Description</label>
                    <textarea id="appDesc" rows="4" placeholder="Detailed description of your app"></textarea>
                </div>

                <div class="form-group">
                    <label>Version</label>
                    <input type="text" id="appVersion" placeholder="1.0.0" value="1.0.0">
                </div>

                <div class="form-group">
                    <label>🔗 Deployment Links (For APK Generation)</label>
                    <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Provide at least one URL where your app is hosted. The APK will load this URL in a WebView.</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <input type="url" id="vercelLink" placeholder="Vercel URL (e.g., https://app.vercel.app)">
                        <input type="url" id="renderLink" placeholder="Render URL (e.g., https://app.onrender.com)">
                        <input type="url" id="netlifyLink" placeholder="Netlify URL (e.g., https://app.netlify.app)">
                        <input type="url" id="githubLink" placeholder="GitHub URL (e.g., https://user.github.io/repo)">
                    </div>
                </div>

                <div class="form-group">
                    <label>Features (comma separated)</label>
                    <input type="text" id="appFeatures" placeholder="Fast, Secure, User-friendly, Offline">
                </div>

                <div class="form-group">
                    <label>Permissions (comma separated)</label>
                    <input type="text" id="appPermissions" placeholder="Internet, Storage, Camera">
                </div>

                <button type="submit" class="btn-submit" id="submitBtn">🚀 Generate & Submit APK</button>
            </form>
        </div>
    `;

    // Character counter
    document.getElementById('shortDesc').addEventListener('input', function() {
        document.getElementById('charCount').textContent = `${this.value.length}/160`;
    });
}

// ============================================
// RENDER FAVORITES
// ============================================
async function renderFavorites(container) {
    if (!Auth.isLoggedIn()) {
        container.innerHTML = `
            <div class="auth-form">
                <h2>🔐 Please Login</h2>
                <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">Login to see your favorite apps.</p>
                <button onclick="navigate('login')" class="btn-submit">Login</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading your favorites...</p>
        </div>
    `;

    try {
        const result = await api.get('/favorites', authToken);
        const favorites = result.data || [];

        container.innerHTML = `
            <div style="padding:20px 24px;">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-heart" style="color:#EF4444;"></i> Your Favorites</h2>
                    <span style="font-size:13px;color:var(--text-muted);">${favorites.length} apps</span>
                </div>
                ${favorites.length > 0
                    ? `<div class="app-grid">${renderAppCards(favorites)}</div>`
                    : `
                        <div style="text-align:center;padding:60px 20px;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                            <i class="fas fa-heart" style="font-size:48px;color:var(--text-muted);margin-bottom:16px;"></i>
                            <h3>No favorites yet</h3>
                            <p style="color:var(--text-muted);">Start adding apps to your favorites collection!</p>
                            <button class="btn-primary" style="margin-top:16px;" onclick="navigate('home')">Browse Apps</button>
                        </div>
                    `
                }
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="text-align:center;padding:40px;">Failed to load favorites</p>`;
    }
}

// ============================================
// RENDER DEVELOPER DASHBOARD
// ============================================
async function renderDeveloperDashboard(container) {
    if (!Auth.isLoggedIn() || (currentUser?.role !== 'developer' && currentUser?.role !== 'admin')) {
        container.innerHTML = `
            <div class="auth-form">
                <h2>🔐 Developer Access Required</h2>
                <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">You need to be a registered developer to access this dashboard.</p>
                <button onclick="navigate('home')" class="btn-submit">Go Home</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading dashboard...</p>
        </div>
    `;

    try {
        const [appsResult, statsResult] = await Promise.all([
            api.get('/developer/apps', authToken).catch(() => ({ data: [] })),
            api.get('/admin/stats', authToken).catch(() => ({}))
        ]);

        const apps = appsResult.data || [];
        const stats = statsResult.data || {};

        container.innerHTML = `
            <div class="dashboard">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-code"></i> Developer Dashboard</h2>
                    <button class="btn-primary" onclick="navigate('submit')"><i class="fas fa-plus"></i> New App</button>
                </div>

                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="number">${apps.length}</div>
                        <div class="label">Total Apps</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="number">${apps.reduce((sum, app) => sum + (app.downloads || 0), 0).toLocaleString()}</div>
                        <div class="label">Total Downloads</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="number">${apps.filter(a => a.status === 'approved').length}</div>
                        <div class="label">Published Apps</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="number">${apps.filter(a => a.status === 'pending').length}</div>
                        <div class="label">Pending Review</div>
                    </div>
                </div>

                <div style="margin-top:20px;">
                    <h3 style="margin-bottom:16px;">Your Apps</h3>
                    ${apps.length > 0
                        ? `<div class="app-grid">${renderAppCards(apps)}</div>`
                        : `
                            <div style="text-align:center;padding:40px;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                                <p style="color:var(--text-muted);">You haven't submitted any apps yet.</p>
                                <button class="btn-primary" style="margin-top:16px;" onclick="navigate('submit')">Submit Your First App</button>
                            </div>
                        `
                    }
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="text-align:center;padding:40px;">Failed to load dashboard</p>`;
    }
}

// ============================================
// RENDER ADMIN PANEL
// ============================================
async function renderAdminPanel(container) {
    if (!Auth.isLoggedIn() || currentUser?.role !== 'admin') {
        container.innerHTML = `
            <div class="auth-form">
                <h2>🔐 Admin Access Required</h2>
                <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">You need admin privileges to access this panel.</p>
                <button onclick="navigate('home')" class="btn-submit">Go Home</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading admin panel...</p>
        </div>
    `;

    try {
        const statsResult = await api.get('/admin/stats', authToken).catch(() => ({}));
        const stats = statsResult.data || {};

        container.innerHTML = `
            <div class="dashboard">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-shield-alt"></i> Admin Panel</h2>
                    <span style="font-size:13px;color:var(--text-muted);">${new Date().toLocaleDateString()}</span>
                </div>

                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="number">${stats.totalApps || 0}</div>
                        <div class="label">Total Apps</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="number">${stats.totalUsers || 0}</div>
                        <div class="label">Total Users</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="number">${stats.totalDownloads || 0}</div>
                        <div class="label">Total Downloads</div>
                    </div>
                    <div class="dashboard-card" style="border-color:var(--warning);">
                        <div class="number" style="color:var(--warning);">${stats.pendingApps || 0}</div>
                        <div class="label">Pending Review</div>
                    </div>
                </div>

                <div style="margin-top:30px;">
                    <h3 style="margin-bottom:16px;">📋 Pending Apps</h3>
                    <div id="pendingAppsList">
                        <p style="color:var(--text-muted);">Loading pending apps...</p>
                    </div>
                </div>

                <div style="margin-top:30px;">
                    <h3 style="margin-bottom:16px;">📊 Top Apps</h3>
                    <div id="topAppsList">
                        <p style="color:var(--text-muted);">Loading top apps...</p>
                    </div>
                </div>
            </div>
        `;

        // Load pending apps
        try {
            const pendingResult = await api.get('/admin/apps?status=pending', authToken);
            const pendingApps = pendingResult.data || [];

            document.getElementById('pendingAppsList').innerHTML = pendingApps.length > 0
                ? pendingApps.map(app => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-card);border-radius:var(--radius-md);margin-bottom:8px;border:1px solid var(--border-color);">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <img src="${app.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6C3CE1&color=fff&size=40`}" style="width:40px;height:40px;border-radius:var(--radius-sm);object-fit:cover;">
                            <div>
                                <strong>${app.name}</strong>
                                <span style="font-size:12px;color:var(--text-muted);display:block;">${app.packageName}</span>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn-primary" style="padding:6px 16px;font-size:12px;" onclick="approveApp('${app._id}')">Approve</button>
                            <button class="btn-secondary" style="padding:6px 16px;font-size:12px;" onclick="rejectApp('${app._id}')">Reject</button>
                        </div>
                    </div>
                `).join('')
                : '<p style="color:var(--text-muted);">No pending apps to review.</p>';
        } catch (e) {
            document.getElementById('pendingAppsList').innerHTML = '<p style="color:var(--text-muted);">Failed to load pending apps.</p>';
        }

        // Load top apps
        try {
            const topResult = await api.get('/apps/top-downloads');
            const topApps = topResult.data || [];

            document.getElementById('topAppsList').innerHTML = topApps.length > 0
                ? topApps.slice(0, 5).map((app, index) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-card);border-radius:var(--radius-md);margin-bottom:6px;border:1px solid var(--border-color);">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-weight:700;color:var(--primary);width:24px;">#${index + 1}</span>
                            <img src="${app.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6C3CE1&color=fff&size=36`}" style="width:36px;height:36px;border-radius:var(--radius-sm);object-fit:cover;">
                            <strong>${app.name}</strong>
                        </div>
                        <span style="color:var(--text-muted);"><i class="fas fa-download"></i> ${app.downloads || 0}</span>
                    </div>
                `).join('')
                : '<p style="color:var(--text-muted);">No apps yet.</p>';
        } catch (e) {
            document.getElementById('topAppsList').innerHTML = '<p style="color:var(--text-muted);">Failed to load top apps.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p style="text-align:center;padding:40px;">Failed to load admin panel</p>`;
    }
}

// ============================================
// RENDER PROFILE
// ============================================
function renderProfile(container) {
    if (!Auth.isLoggedIn()) {
        navigate('login');
        return;
    }

    container.innerHTML = `
        <div style="max-width:600px;margin:40px auto;padding:0 24px;">
            <div style="background:var(--bg-card);border-radius:var(--radius-xl);padding:40px;border:1px solid var(--border-color);box-shadow:var(--shadow-md);">
                <div style="text-align:center;">
                    <div style="width:100px;height:100px;border-radius:50%;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:40px;font-weight:700;color:white;">
                        ${currentUser?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <h2 style="font-size:24px;">${currentUser?.username}</h2>
                    <p style="color:var(--text-muted);">${currentUser?.email}</p>
                    <p style="display:inline-block;background:rgba(108,60,225,0.1);color:var(--primary);padding:4px 16px;border-radius:var(--radius-full);font-size:12px;font-weight:600;margin-top:8px;">
                        ${currentUser?.role?.toUpperCase() || 'USER'}
                    </p>
                </div>

                <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border-color);">
                    <div style="display:flex;justify-content:space-around;">
                        <div style="text-align:center;">
                            <div style="font-size:20px;font-weight:700;">${currentUser?.favorites?.length || 0}</div>
                            <div style="font-size:13px;color:var(--text-muted);">Favorites</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:20px;font-weight:700;">${currentUser?.downloads?.length || 0}</div>
                            <div style="font-size:13px;color:var(--text-muted);">Downloads</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:20px;font-weight:700;">${currentUser?.isVerified ? '✅' : '⏳'}</div>
                            <div style="font-size:13px;color:var(--text-muted);">Verified</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border-color);">
                    <button class="btn-submit" onclick="Auth.logout()" style="background:var(--danger);"><i class="fas fa-sign-out-alt"></i> Logout</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// HANDLERS
// ============================================

// LOGIN HANDLER - Email + Password only
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    console.log('📧 Login attempt for:', email);

    const btn = e.target.querySelector('.btn-submit');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    btn.disabled = true;

    const result = await Auth.login(email, password);

    btn.innerHTML = original;
    btn.disabled = false;
}

// REGISTER HANDLER
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole')?.value || 'user';

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

    console.log('📝 Registration attempt for:', username);

    const btn = e.target.querySelector('.btn-submit');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;

    const result = await Auth.register(username, email, password, role);

    btn.innerHTML = original;
    btn.disabled = false;
}

// ============================================
// SUBMIT APP HANDLER
// ============================================
async function handleSubmitApp(e) {
    e.preventDefault();

    const progressDiv = document.getElementById('generationProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    const submitBtn = document.getElementById('submitBtn');

    progressDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    function updateProgress(percent, message) {
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
        progressStatus.textContent = message;
    }

    updateProgress(10, '📝 Collecting app data...');

    const data = {
        name: document.getElementById('appName').value,
        packageName: document.getElementById('packageName').value,
        category: document.getElementById('appCategory').value,
        shortDescription: document.getElementById('shortDesc').value,
        description: document.getElementById('appDesc').value || 'No description',
        version: document.getElementById('appVersion').value || '1.0.0',
        features: document.getElementById('appFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        permissions: document.getElementById('appPermissions').value.split(',').map(p => p.trim()).filter(p => p),
        deployment: {
            vercel: document.getElementById('vercelLink').value || '',
            render: document.getElementById('renderLink').value || '',
            netlify: document.getElementById('netlifyLink').value || '',
            github: document.getElementById('githubLink').value || ''
        }
    };

    const hasDeployment = Object.values(data.deployment).some(url => url && url.length > 0);
    if (!hasDeployment) {
        showNotification('⚠️ Please provide at least one deployment URL', 'error');
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 Generate & Submit APK';
        return;
    }

    updateProgress(30, '📤 Submitting to server...');

    try {
        const result = await api.post('/apps/submit', data, authToken);

        if (result.success) {
            updateProgress(70, '✅ App saved! Generating APK...');

            if (result.generation || result.apkUrl) {
                updateProgress(90, '📦 APK generated successfully!');
                await new Promise(resolve => setTimeout(resolve, 500));
                updateProgress(100, '🎉 Done! APK is ready for download.');

                showNotification(`✅ "${data.name}" submitted and APK generated!`, 'success');

                setTimeout(() => {
                    document.getElementById('submitForm').reset();
                    document.getElementById('charCount').textContent = '0/160';
                    progressDiv.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '🚀 Generate & Submit APK';

                    const packageName = result.data?.app?.packageName || data.packageName;
                    navigate('app', packageName);
                }, 1000);
            } else {
                updateProgress(80, '⚠️ APK generation in progress...');
                showNotification(`✅ "${data.name}" submitted!`, 'info');

                setTimeout(() => {
                    progressDiv.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '🚀 Generate & Submit APK';
                    document.getElementById('submitForm').reset();
                    navigate('home');
                }, 2000);
            }
        } else {
            updateProgress(0, '❌ Submission failed');
            showNotification(result.message || 'Submission failed', 'error');

            setTimeout(() => {
                progressDiv.style.display = 'none';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Generate & Submit APK';
            }, 1500);
        }
    } catch (error) {
        console.error('Submission error:', error);
        updateProgress(0, '❌ Error: ' + error.message);
        showNotification('❌ Submission failed: ' + error.message, 'error');

        setTimeout(() => {
            progressDiv.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 Generate & Submit APK';
        }, 1500);
    }
}

// ============================================
// DOWNLOAD HANDLER
// ============================================
async function handleDownload(appId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to download', 'error');
        navigate('login');
        return;
    }

    try {
        showNotification('📥 Preparing download...', 'info');

        const result = await api.get(`/apps/${appId}`, authToken);
        const app = result.data;

        if (!app) {
            showNotification('❌ App not found', 'error');
            return;
        }

        const downloadUrl = `${CONFIG.API_URL}/apps/download/${app.packageName || appId}`;
        window.open(downloadUrl, '_blank');
        showNotification(`✅ Downloading ${app.name}...`, 'success');
    } catch (error) {
        showNotification('❌ Download failed: ' + error.message, 'error');
    }
}

// ============================================
// FAVORITE HANDLER
// ============================================
async function handleFavorite(btn, appId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to favorite', 'error');
        navigate('login');
        return;
    }

    try {
        const result = await api.post(`/favorites/${appId}`, {}, authToken);
        if (result.success) {
            btn.classList.toggle('active');
            const isFavorite = btn.classList.contains('active');
            btn.style.background = isFavorite ? 'rgba(239,68,68,0.15)' : 'var(--bg-input)';
            btn.style.color = isFavorite ? 'var(--danger)' : 'var(--text-secondary)';
            showNotification(isFavorite ? '❤️ Added to favorites' : '💔 Removed from favorites', 'success');
            await Auth.loadUser();
        }
    } catch (error) {
        showNotification('Failed to update favorites', 'error');
    }
}

// ============================================
// REVIEW HANDLER
// ============================================
async function submitReview(e, appId) {
    e.preventDefault();

    if (!Auth.isLoggedIn()) {
        showNotification('Please login to review', 'error');
        return;
    }

    const rating = parseInt(document.getElementById('reviewRating').value);
    const title = document.getElementById('reviewTitle').value.trim();
    const comment = document.getElementById('reviewComment').value.trim();

    if (!comment) {
        showNotification('Please write a comment', 'error');
        return;
    }

    try {
        const result = await api.post('/reviews', {
            appId,
            rating,
            title,
            comment
        }, authToken);

        if (result.success) {
            showNotification('✅ Review submitted!', 'success');
            document.getElementById('reviewTitle').value = '';
            document.getElementById('reviewComment').value = '';
            navigate('app', appId);
        }
    } catch (error) {
        showNotification('❌ Failed to submit review: ' + error.message, 'error');
    }
}

// ============================================
// ADMIN HANDLERS
// ============================================
async function approveApp(appId) {
    try {
        const result = await api.patch(`/admin/apps/${appId}`, {
            status: 'approved'
        }, authToken);
        if (result.success) {
            showNotification('✅ App approved!', 'success');
            navigate('admin');
        }
    } catch (error) {
        showNotification('❌ Failed to approve app', 'error');
    }
}

async function rejectApp(appId) {
    try {
        const result = await api.patch(`/admin/apps/${appId}`, {
            status: 'rejected'
        }, authToken);
        if (result.success) {
            showNotification('App rejected', 'info');
            navigate('admin');
        }
    } catch (error) {
        showNotification('❌ Failed to reject app', 'error');
    }
}

// ============================================
// CATEGORY FILTER
// ============================================
async function filterByCategory(category) {
    try {
        const result = await api.get(`/apps?category=${category}`);
        const apps = result.data || [];

        if (apps.length === 0) {
            showNotification(`No apps found in ${category}`, 'info');
            return;
        }

        const main = document.getElementById('mainContent');
        main.innerHTML = `
            <div style="padding:20px 24px;">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-th-large"></i> ${category.charAt(0).toUpperCase() + category.slice(1)} Apps</h2>
                    <a href="#" class="section-link" onclick="navigate('home')">← Back to Home</a>
                </div>
                <div class="app-grid">${renderAppCards(apps)}</div>
            </div>
        `;
    } catch (error) {
        showNotification('Failed to load category', 'error');
    }
}

// ============================================
// SEARCH
// ============================================
async function searchApps() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching for "${query}"...</p>
        </div>
    `;

    try {
        const result = await api.get(`/search?q=${encodeURIComponent(query)}`);
        const apps = result.data || [];

        main.innerHTML = `
            <div style="padding:20px 24px;">
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-search"></i> Results for "${query}"</h2>
                    <span style="font-size:13px;color:var(--text-muted);">${apps.length} apps found</span>
                </div>
                ${apps.length > 0
                    ? `<div class="app-grid">${renderAppCards(apps)}</div>`
                    : `
                        <div style="text-align:center;padding:60px 20px;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                            <i class="fas fa-search" style="font-size:48px;color:var(--text-muted);margin-bottom:16px;"></i>
                            <h3>No results found</h3>
                            <p style="color:var(--text-muted);">Try searching with different keywords</p>
                            <button class="btn-primary" style="margin-top:16px;" onclick="navigate('home')">Back to Home</button>
                        </div>
                    `
                }
            </div>
        `;
    } catch (error) {
        main.innerHTML = `<p style="text-align:center;padding:40px;">Search failed</p>`;
    }
}

// ============================================
// HELPERS
// ============================================
function getCategoryIcon(category) {
    const icons = {
        'Games': '🎮',
        'Education': '📚',
        'Finance': '💰',
        'Social': '👥',
        'Tools': '🔧',
        'Productivity': '📊',
        'Health': '💪',
        'Music': '🎵',
        'Entertainment': '🎬',
        'News': '📰',
        'Shopping': '🛒',
        'Travel': '✈️',
        'Sports': '⚽',
        'Photography': '📸',
        'Books': '📖',
        'Business': '💼',
        'Lifestyle': '🌿',
        'Communication': '💬'
    };
    return icons[category] || '📁';
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
    console.log(`📍 Backend: ${CONFIG.API_URL}`);
    
    // Load theme
    loadTheme();
    
    // Check server health
    const isHealthy = await Auth.checkHealth();
    if (!isHealthy) {
        showNotification('⚠️ Server is starting up. Please wait a moment.', 'warning');
    }
    
    // Load user
    await Auth.loadUser();
    
    // Navigate to home
    navigate('home');

    // Search on Enter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchApps();
        });
    }

    console.log('✅ APK Store initialized successfully!');
});

// ============================================
// GLOBAL EXPOSURE
// ============================================
window.navigate = navigate;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleSubmitApp = handleSubmitApp;
window.handleDownload = handleDownload;
window.handleFavorite = handleFavorite;
window.submitReview = submitReview;
window.approveApp = approveApp;
window.rejectApp = rejectApp;
window.filterByCategory = filterByCategory;
window.searchApps = searchApps;
window.toggleTheme = toggleTheme;
window.showNotification = showNotification;
window.Auth = Auth;
window.api = api;
window.CONFIG = CONFIG;

console.log('✅ All functions exposed globally');
