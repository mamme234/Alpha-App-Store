// ============================================
// ALPHA APP STORE - COMPLETE JAVASCRIPT
// Frontend: Vercel | Backend: Render
// ============================================

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_URL: 'https://alpha-app-store.onrender.com/api',
    FRONTEND_URL: 'https://alpha-app-store.vercel.app',
    APP_NAME: 'Alpha App Store',
    VERSION: '1.0.0'
};

console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
console.log(`📍 Backend API: ${CONFIG.API_URL}`);

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
            const res = await fetch(url, { headers, credentials: 'include' });
            
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
            const url = `${CONFIG.API_URL}${endpoint}`;
            console.log(`📡 POST: ${url}`);
            const res = await fetch(url, {
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
    }
};

// ============================================
// AUTH STATE
// ============================================
let currentUser = null;
let authToken = localStorage.getItem('token');

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
    },

    checkHealth: async () => {
        try {
            const res = await fetch('https://alpha-app-store.onrender.com/health');
            if (res.ok) {
                console.log('✅ Server is healthy');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Health check failed:', error);
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
        case 'home': renderHome(mainContent); break;
        case 'categories': renderCategories(mainContent); break;
        case 'app': renderAppDetail(mainContent, params); break;
        case 'login': renderLogin(mainContent); break;
        case 'register': renderRegister(mainContent); break;
        case 'submit': renderSubmit(mainContent); break;
        case 'favorites': renderFavorites(mainContent); break;
        case 'search': renderSearch(mainContent, params); break;
        default: renderHome(mainContent);
    }
}

// ============================================
// RENDER HOME
// ============================================
async function renderHome(container) {
    container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:48px;color:#4f46e5;"></i>
            <p style="margin-top:16px;color:#6b7280;">Loading apps...</p>
        </div>
    `;

    const isHealthy = await Auth.checkHealth();
    if (!isHealthy) {
        showNotification('⚠️ Server starting up. Please wait.', 'warning');
    }

    try {
        const [featuredRes, trendingRes, allAppsRes] = await Promise.all([
            api.get('/apps/featured').catch(() => ({ data: [] })),
            api.get('/apps/trending').catch(() => ({ data: [] })),
            api.get('/apps').catch(() => ({ data: [] }))
        ]);

        const featuredApps = featuredRes.data || [];
        const trendingApps = trendingRes.data || [];
        const allApps = allAppsRes.data || [];

        const recentApps = [...allApps].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 8);

        container.innerHTML = `
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
                            <div class="stat-number">${allApps.length}+</div>
                            <div class="stat-label">Apps Available</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${allApps.reduce((sum, app) => sum + (app.downloads || 0), 0).toLocaleString()}</div>
                            <div class="stat-label">Total Downloads</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${new Set(allApps.map(a => a.developer?._id || a.developer)).size}+</div>
                            <div class="stat-label">Developers</div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-th-large"></i> Categories</h2>
                    <a href="#" class="section-link" onclick="navigateTo('categories')">View All →</a>
                </div>
                <div class="categories-grid">${renderCategoriesGrid()}</div>
            </section>

            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-clock" style="color:#f59e0b;"></i> Recently Added</h2>
                    <span style="font-size:13px;color:#6b7280;">${recentApps.length} new apps</span>
                </div>
                <div class="app-grid">
                    ${recentApps.length > 0 ? renderAppCards(recentApps, 'recent') : '<p style="text-align:center;padding:20px;color:#6b7280;">No apps yet. Be the first to submit!</p>'}
                </div>
            </section>

            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-star"></i> Featured Apps</h2>
                    <a href="#" class="section-link" onclick="showNotification('All featured apps', 'info')">View All →</a>
                </div>
                <div class="app-grid">
                    ${featuredApps.length > 0 ? renderAppCards(featuredApps, 'featured') : '<p style="text-align:center;padding:20px;color:#6b7280;">No featured apps yet</p>'}
                </div>
            </section>

            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-fire"></i> Trending Now</h2>
                    <a href="#" class="section-link" onclick="showNotification('All trending apps', 'info')">View All →</a>
                </div>
                <div class="app-grid">
                    ${trendingApps.length > 0 ? renderAppCards(trendingApps, 'trending') : '<p style="text-align:center;padding:20px;color:#6b7280;">No trending apps yet</p>'}
                </div>
            </section>

            <section class="submit-banner">
                <div class="submit-content">
                    <h2>🚀 Submit Your App</h2>
                    <p>Share your app with millions of users. Get more downloads, reviews, and grow your audience.</p>
                    <a href="#" class="btn-primary" onclick="navigateTo('submit')"><i class="fas fa-upload"></i> Submit Now</a>
                </div>
                <div class="submit-stats">
                    <div class="stat">
                        <span class="stat-number">${allApps.length}+</span>
                        <span class="stat-label">Apps Available</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${allApps.reduce((sum, app) => sum + (app.downloads || 0), 0).toLocaleString()}</span>
                        <span class="stat-label">Total Downloads</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${new Set(allApps.map(a => a.developer?._id || a.developer)).size}+</span>
                        <span class="stat-label">Developers</span>
                    </div>
                </div>
            </section>
        `;
    } catch (error) {
        console.error('Error loading apps:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:#ef4444;"></i>
                <h3 style="margin-top:16px;">Failed to load apps</h3>
                <p style="color:#6b7280;">Please refresh the page or try again later.</p>
                <button class="btn-primary" style="margin-top:16px;" onclick="renderHome(document.getElementById('mainContent'))">Retry</button>
            </div>
        `;
    }
}

// ============================================
// RENDER APP CARDS
// ============================================
function renderAppCards(apps, type = 'featured') {
    if (!apps || apps.length === 0) return '';
    
    return apps.map(app => {
        const isFavorite = Auth.isLoggedIn() && currentUser?.favorites?.includes(app._id);
        const iconUrl = app.icon || `https://via.placeholder.com/64/4f46e5/ffffff?text=${app.name.charAt(0)}`;
        const isNew = app.createdAt && (new Date() - new Date(app.createdAt)) < 24 * 60 * 60 * 1000;
        const isGenerated = app.generated === true || app.status === 'generated' || app.status === 'approved';
        
        return `
            <div class="app-card" onclick="navigateTo('app', '${app._id || app.packageName}')" style="position:relative;cursor:pointer;">
                ${isNew ? '<div class="new-badge" style="position:absolute;top:12px;right:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;">🆕 NEW</div>' : ''}
                ${type === 'featured' ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                ${type === 'trending' ? '<div class="trending-badge">🔥 Trending</div>' : ''}
                ${isGenerated && type !== 'featured' && type !== 'trending' ? '<div class="generated-badge" style="position:absolute;top:12px;left:12px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;">📦 APK Ready</div>' : ''}
                <div class="app-header">
                    <img src="${iconUrl}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/64/4f46e5/ffffff?text=${app.name.charAt(0)}'">
                    <div class="app-info">
                        <h3 class="app-name">${app.name}</h3>
                        <p class="app-desc">${app.shortDescription || app.description || app.name}</p>
                        <div class="app-meta">
                            <span class="app-rating">⭐ ${app.rating || 0}</span>
                            <span class="app-downloads">⬇️ ${app.downloads || 0}</span>
                            <span class="app-category">${app.category || 'General'}</span>
                            ${app.fileSize ? `<span class="app-size">💾 ${app.fileSize}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="app-actions" onclick="event.stopPropagation();">
                    <button class="btn-download" onclick="handleDownload('${app._id || app.packageName}')">
                        <i class="fas fa-download"></i> ${isGenerated ? 'Download APK' : 'Download'}
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
        { name: 'News', icon: 'newspaper' }
    ];
    
    return categories.map(cat => `
        <div class="category-card" onclick="filterByCategory('${cat.name}')">
            <i class="fas fa-${cat.icon}"></i>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

// ============================================
// FILTER BY CATEGORY
// ============================================
async function filterByCategory(category) {
    try {
        const result = await api.get(`/apps?category=${category.toLowerCase()}`);
        const apps = result.data || [];
        
        if (apps.length === 0) {
            showNotification(`No apps found in ${category}`, 'info');
            return;
        }
        
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-${category.toLowerCase()}"></i> ${category} Apps</h2>
                    <a href="#" class="section-link" onclick="navigateTo('home')">← Back to Home</a>
                </div>
                <div class="app-grid">${renderAppCards(apps, '')}</div>
            </section>
        `;
    } catch (error) {
        showNotification('Failed to load category', 'error');
    }
}

// ============================================
// RENDER APP DETAIL
// ============================================
async function renderAppDetail(container, appId) {
    container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:48px;color:#4f46e5;"></i>
            <p style="margin-top:16px;color:#6b7280;">Loading app details...</p>
        </div>
    `;

    try {
        const result = await api.get(`/apps/${appId}`);
        const app = result.data;
        
        if (!app) {
            container.innerHTML = `<p style="text-align:center;padding:40px;">App not found</p>`;
            return;
        }

        const iconUrl = app.icon || `https://via.placeholder.com/120/4f46e5/ffffff?text=${app.name.charAt(0)}`;
        const isFavorite = Auth.isLoggedIn() && currentUser?.favorites?.includes(app._id);
        const isGenerated = app.generated === true || app.status === 'generated' || app.status === 'approved';

        container.innerHTML = `
            <div class="app-detail">
                <div class="header">
                    <img src="${iconUrl}" alt="${app.name}" class="icon" onerror="this.src='https://via.placeholder.com/120/4f46e5/ffffff?text=${app.name.charAt(0)}'">
                    <div class="info">
                        <h1>${app.name}</h1>
                        <div class="package">📦 ${app.packageName}</div>
                        <div class="meta">
                            <span>📌 ${app.version || '1.0.0'}</span>
                            <span>📱 Android ${app.minAndroidVersion || '5.0'}+</span>
                            <span>💾 ${app.fileSize || '5MB'}</span>
                            <span>⭐ ${app.rating || 0}</span>
                            <span>⬇️ ${app.downloads || 0}</span>
                            ${isGenerated ? '<span style="background:#4f46e5;color:white;padding:2px 12px;border-radius:12px;font-size:12px;">✅ APK Generated</span>' : ''}
                        </div>
                        ${isGenerated ? `
                            <button class="download-btn" onclick="handleDownload('${app._id || app.packageName}')">
                                <i class="fas fa-download"></i> Download APK (${app.fileSize || '5MB'})
                            </button>
                        ` : `
                            <div style="margin-top:10px;padding:12px;background:#fef3c7;border-radius:12px;color:#92400e;">
                                <i class="fas fa-clock"></i> APK is being generated. Please wait...
                            </div>
                        `}
                        <button class="btn-fav ${isFavorite ? 'active' : ''}" onclick="handleFavorite(this, '${app._id}')" style="padding:14px 24px;font-size:16px;margin-top:10px;border:none;border-radius:12px;cursor:pointer;">
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
                    <div style="margin-top:20px;">
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
                    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
                        🏗️ Generated: ${new Date(app.generatedAt).toLocaleString()}
                    </div>
                ` : ''}
                
                <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;display:flex;gap:20px;flex-wrap:wrap;">
                    <span>👤 Developer: ${app.developer?.username || 'Unknown'}</span>
                    <span>📅 Submitted: ${new Date(app.createdAt).toLocaleDateString()}</span>
                    <span>🔄 Status: ${app.status || 'pending'}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading app details:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:#ef4444;"></i>
                <h3 style="margin-top:16px;">Failed to load app</h3>
                <p style="color:#6b7280;">${error.message || 'Please try again'}</p>
                <button class="btn-primary" style="margin-top:16px;" onclick="navigateTo('home')">Back to Home</button>
            </div>
        `;
    }
}

// ============================================
// RENDER FAVORITES
// ============================================
async function renderFavorites(container) {
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

    try {
        const result = await api.get('/apps', authToken);
        const allApps = result.data || [];
        const favoriteIds = currentUser?.favorites || [];
        const favorites = allApps.filter(app => favoriteIds.includes(app._id));

        container.innerHTML = `
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-heart" style="color:#ef4444;"></i> Your Favorites</h2>
                </div>
                ${favorites.length > 0 ? `
                    <div class="app-grid">${renderAppCards(favorites, '')}</div>
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
    } catch (error) {
        showNotification('Failed to load favorites', 'error');
        container.innerHTML = `<p style="text-align:center;padding:40px;">Failed to load favorites</p>`;
    }
}

// ============================================
// RENDER SEARCH
// ============================================
async function renderSearch(container, query) {
    container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:48px;color:#4f46e5;"></i>
            <p style="margin-top:16px;color:#6b7280;">Searching for "${query}"...</p>
        </div>
    `;

    try {
        const result = await api.get(`/apps`);
        const allApps = result.data || [];
        const results = allApps.filter(app => 
            app.name.toLowerCase().includes(query.toLowerCase()) ||
            (app.description && app.description.toLowerCase().includes(query.toLowerCase())) ||
            (app.shortDescription && app.shortDescription.toLowerCase().includes(query.toLowerCase())) ||
            (app.category && app.category.toLowerCase().includes(query.toLowerCase()))
        );

        container.innerHTML = `
            <section>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-search"></i> Results for "${query}"</h2>
                    <span style="color:#6b7280;font-size:14px;">${results.length} apps found</span>
                </div>
                ${results.length > 0 ? `
                    <div class="app-grid">${renderAppCards(results, '')}</div>
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
    } catch (error) {
        showNotification('Search failed', 'error');
        container.innerHTML = `<p style="text-align:center;padding:40px;">Failed to search</p>`;
    }
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
// RENDER SUBMIT - WITH APK GENERATION PROGRESS
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
            
            <!-- Progress Bar (hidden initially) -->
            <div id="generationProgress" style="display:none;margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span style="font-weight:600;">Generating APK...</span>
                    <span id="progressText">0%</span>
                </div>
                <div style="width:100%;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
                    <div id="progressBar" style="width:0%;height:100%;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:4px;transition:width 0.5s;"></div>
                </div>
                <p id="progressStatus" style="font-size:13px;color:#6b7280;margin-top:8px;">Starting generation...</p>
            </div>
            
            <form id="submitForm" onsubmit="handleSubmitApp(event)">
                <div class="form-group">
                    <label>App Name *</label>
                    <input type="text" id="appName" required placeholder="My Awesome App">
                </div>
                
                <div class="form-group">
                    <label>Package Name *</label>
                    <input type="text" id="packageName" required placeholder="com.example.app">
                    <small style="color:#6b7280;font-size:12px;">Use reverse domain format (e.g., com.yourcompany.appname)</small>
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
                    <small style="color:#6b7280;font-size:12px;" id="charCount">0/160</small>
                </div>
                
                <div class="form-group">
                    <label>Full Description</label>
                    <textarea id="appDesc" rows="4" placeholder="Detailed description of your app"></textarea>
                </div>
                
                <div class="form-group">
                    <label>🔗 Deployment Links (For APK Generation)</label>
                    <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">Provide at least one URL where your app is hosted. The APK will load this URL in a WebView.</p>
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
                
                <button type="submit" class="btn-submit" id="submitBtn">🚀 Generate & Submit APK</button>
            </form>
        </div>
    `;

    // Character counter for short description
    document.getElementById('shortDesc').addEventListener('input', function() {
        document.getElementById('charCount').textContent = `${this.value.length}/160`;
    });
}

// ============================================
// HANDLE SUBMIT WITH PROGRESS
// ============================================
async function handleSubmitApp(e) {
    e.preventDefault();
    
    // Show progress bar
    const progressDiv = document.getElementById('generationProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    const submitBtn = document.getElementById('submitBtn');
    
    progressDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    // Step 1: Collect data
    updateProgress(progressBar, progressText, progressStatus, 10, '📝 Collecting app data...');
    
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

    // Validate deployment URL
    const hasDeployment = Object.values(data.deployment).some(url => url && url.length > 0);
    if (!hasDeployment) {
        showNotification('⚠️ Please provide at least one deployment URL', 'error');
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 Generate & Submit APK';
        return;
    }

    updateProgress(progressBar, progressText, progressStatus, 30, '📤 Submitting to server...');

    try {
        // Step 2: Submit to API
        const result = await api.post('/apps/submit', data, authToken);
        
        if (result.success) {
            updateProgress(progressBar, progressText, progressStatus, 70, '✅ App saved! Generating APK...');
            
            // Step 3: Check if APK was generated
            if (result.apkUrl || result.downloadUrl) {
                updateProgress(progressBar, progressText, progressStatus, 90, '📦 APK generated successfully!');
                
                // Small delay to show completion
                await new Promise(resolve => setTimeout(resolve, 500));
                updateProgress(progressBar, progressText, progressStatus, 100, '🎉 Done! APK is ready for download.');
                
                showNotification(`✅ "${data.name}" submitted and APK generated!`, 'success');
                
                // Step 4: Show download option
                setTimeout(() => {
                    // Reset form
                    document.getElementById('submitForm').reset();
                    document.getElementById('charCount').textContent = '0/160';
                    progressDiv.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '🚀 Generate & Submit APK';
                    
                    // Show success with download link
                    showNotification(`📥 Download your APK from the app page!`, 'success');
                    
                    // Navigate to home after 2 seconds
                    setTimeout(() => {
                        renderHome(document.getElementById('mainContent'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 1000);
                }, 1000);
                
            } else {
                updateProgress(progressBar, progressText, progressStatus, 80, '⚠️ APK generation in progress...');
                showNotification(`✅ "${data.name}" submitted! APK is being generated.`, 'info');
                
                setTimeout(() => {
                    progressDiv.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '🚀 Generate & Submit APK';
                    document.getElementById('submitForm').reset();
                    navigateTo('home');
                }, 2000);
            }
        } else {
            updateProgress(progressBar, progressText, progressStatus, 0, '❌ Submission failed');
            showNotification(result.message || 'Submission failed', 'error');
            
            setTimeout(() => {
                progressDiv.style.display = 'none';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Generate & Submit APK';
            }, 1500);
        }
    } catch (error) {
        console.error('Submission error:', error);
        updateProgress(progressBar, progressText, progressStatus, 0, '❌ Error: ' + error.message);
        showNotification('❌ Submission failed: ' + error.message, 'error');
        
        setTimeout(() => {
            progressDiv.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 Generate & Submit APK';
        }, 1500);
    }
}

// ============================================
// UPDATE PROGRESS HELPER
// ============================================
function updateProgress(bar, text, status, percent, message) {
    bar.style.width = percent + '%';
    text.textContent = percent + '%';
    status.textContent = message;
}

// ============================================
// HANDLE DOWNLOAD
// ============================================
async function handleDownload(appId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to download', 'error');
        navigateTo('login');
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
        
        // Check if APK exists
        const downloadUrl = `${CONFIG.API_URL}/apps/download/${app.packageName || appId}`;
        console.log(`📥 Downloading from: ${downloadUrl}`);
        
        // Open in new tab
        window.open(downloadUrl, '_blank');
        showNotification(`✅ Downloading ${app.name}...`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('❌ Download failed: ' + error.message, 'error');
    }
}

// ============================================
// HANDLE FAVORITE
// ============================================
async function handleFavorite(btn, appId) {
    if (!Auth.isLoggedIn()) {
        showNotification('Please login to favorite', 'error');
        navigateTo('login');
        return;
    }
    
    try {
        const result = await api.post(`/apps/${appId}/favorite`, {}, authToken);
        if (result.success) {
            btn.classList.toggle('active');
            showNotification('❤️ Favorites updated!', 'success');
            await Auth.loadUser();
        }
    } catch (error) {
        showNotification('Failed to update favorites', 'error');
    }
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
    
    await Auth.loadUser();
    
    const isHealthy = await Auth.checkHealth();
    if (!isHealthy) {
        showNotification('⚠️ Server is starting up. Please wait a moment.', 'warning');
    }
    
    navigateTo('home');
    
    document.getElementById('searchBtn').addEventListener('click', () => {
        const query = document.getElementById('searchInput').value.trim();
        if (query) navigateTo('search', query);
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) navigateTo('search', query);
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
window.filterByCategory = filterByCategory;
window.showNotification = showNotification;
window.Auth = Auth;
window.api = api;
window.CONFIG = CONFIG;

console.log('✅ All functions exposed globally');
