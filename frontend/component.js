// ===== RENDER HOME =====
async function renderHome(container) {
  try {
    const [featured, trending, allApps] = await Promise.all([
      AppAPI.getFeatured(),
      AppAPI.getTrending(),
      AppAPI.getAll('?limit=12')
    ]);

    container.innerHTML = `
      <div class="hero">
        <h1>Discover Amazing Apps</h1>
        <p>Find the best apps for your Android device. Download safely and securely.</p>
      </div>
      
      ${renderAppSection('Featured Apps', featured.data || [])}
      ${renderAppSection('Trending Now', trending.data || [])}
      ${renderAppSection('New & Updated', allApps.data || [])}
    `;
  } catch (error) {
    container.innerHTML = '<p class="error">Failed to load apps. Please try again.</p>';
  }
}

// ===== RENDER APP SECTION =====
function renderAppSection(title, apps) {
  if (!apps || apps.length === 0) return '';
  
  return `
    <div class="section-title">
      ${title}
      <a href="#" class="see-all">See All →</a>
    </div>
    <div class="app-grid">
      ${apps.map(app => renderAppCard(app)).join('')}
    </div>
  `;
}

// ===== RENDER APP CARD =====
function renderAppCard(app) {
  const isFavorite = Auth.isLoggedIn() && 
    currentUser?.favorites?.includes(app._id);
  
  return `
    <div class="app-card" data-id="${app._id}">
      <div style="display:flex;gap:12px;">
        <img src="${app.icon || 'https://via.placeholder.com/64'}" alt="${app.name}" class="app-icon">
        <div style="flex:1;">
          <div class="app-name">${app.name}</div>
          <div class="app-desc">${app.shortDescription || ''}</div>
          <div class="app-meta">
            <span class="app-rating">★ ${app.rating || 0}</span>
            <span>${app.downloads || 0} downloads</span>
            <span class="app-category">${app.category}</span>
          </div>
        </div>
      </div>
      <div class="app-actions">
        <button class="btn-download" onclick="event.stopPropagation(); handleDownload('${app._id}')">
          <i class="fas fa-download"></i> Download
        </button>
        <button class="btn-fav ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); handleFavorite('${app._id}')">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    </div>
  `;
}

// ===== RENDER APP DETAIL =====
async function renderAppDetail(container, appId) {
  try {
    const result = await AppAPI.getOne(appId);
    const app = result.data;
    
    if (!app) {
      container.innerHTML = '<p>App not found</p>';
      return;
    }

    container.innerHTML = `
      <div class="app-detail">
        <div class="header">
          <img src="${app.icon || 'https://via.placeholder.com/120'}" alt="${app.name}" class="icon">
          <div class="info">
            <h1>${app.name}</h1>
            <div class="package">${app.packageName}</div>
            <div class="meta">
              <span>📦 ${app.version}</span>
              <span>📱 ${app.minAndroidVersion}</span>
              <span>💾 ${app.fileSize}</span>
              <span>⭐ ${app.rating || 0}</span>
              <span>⬇️ ${app.downloads || 0}</span>
            </div>
            <button class="download-btn" onclick="handleDownload('${app._id}')">
              <i class="fas fa-download"></i> Download APK
            </button>
          </div>
        </div>
        
        <div class="description">
          <h2>Description</h2>
          <p>${app.description || 'No description available.'}</p>
        </div>
        
        ${app.features?.length ? `
          <div class="features">
            <h2>Features</h2>
            <ul>
              ${app.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${app.permissions?.length ? `
          <div class="features" style="margin-top:20px;">
            <h2>Permissions</h2>
            <ul>
              ${app.permissions.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p>Failed to load app details</p>';
  }
}

// ===== RENDER LOGIN =====
function renderLogin(container) {
  if (Auth.isLoggedIn()) {
    navigateTo('home');
    return;
  }
  
  container.innerHTML = `
    <div class="auth-form">
      <h2>Welcome Back</h2>
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
      <h2>Create Account</h2>
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

// ===== RENDER SEARCH =====
async function renderSearchResults(container, params) {
  const query = params?.q || '';
  container.innerHTML = `<h2>Search results for: "${query}"</h2><div class="app-grid" id="searchResults">Loading...</div>`;
  
  try {
    const result = await AppAPI.getAll(`?search=${encodeURIComponent(query)}`);
    const grid = document.getElementById('searchResults');
    if (result.data && result.data.length > 0) {
      grid.innerHTML = result.data.map(app => renderAppCard(app)).join('');
    } else {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;">No apps found</p>';
    }
  } catch (error) {
    document.getElementById('searchResults').innerHTML = '<p>Search failed</p>';
  }
}

// ===== HANDLE LOGIN =====
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const result = await Auth.login(email, password);
  if (result.success) {
    updateAuthButton();
    navigateTo('home');
  }
}

// ===== HANDLE REGISTER =====
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const result = await Auth.register(username, email, password);
  if (result.success) {
    updateAuthButton();
    navigateTo('home');
  }
}

// ===== HANDLE DOWNLOAD =====
function handleDownload(appId) {
  if (!Auth.isLoggedIn()) {
    showNotification('Please login to download', 'error');
    navigateTo('login');
    return;
  }
  showNotification('Download started!', 'success');
}

// ===== HANDLE FAVORITE =====
async function handleFavorite(appId) {
  if (!Auth.isLoggedIn()) {
    showNotification('Please login to favorite', 'error');
    navigateTo('login');
    return;
  }
  
  try {
    const result = await AppAPI.toggleFavorite(appId, authToken);
    if (result.success) {
      const btn = event?.target?.closest('.btn-fav');
      if (btn) {
        btn.classList.toggle('active');
      }
      showNotification('Updated favorites', 'success');
    }
  } catch (error) {
    showNotification('Failed to update', 'error');
  }
}

// ===== APP CARD CLICK =====
document.addEventListener('click', (e) => {
  const card = e.target.closest('.app-card');
  if (card && !e.target.closest('.app-actions')) {
    const id = card.dataset.id;
    if (id) navigateTo('app', id);
  }
});
