// ===== RENDER HOME =====
async function renderHome(container) {
  try {
    const [featured, trending, allApps] = await Promise.all([
      AppAPI.getFeatured(),
      AppAPI.getTrending(),
      AppAPI.getAll()
    ]);

    container.innerHTML = `
      <div class="hero">
        <h1>📱 Discover Amazing Apps</h1>
        <p>Find the best apps for your Android device. Download safely and securely.</p>
      </div>
      
      ${renderAppSection('⭐ Featured Apps', featured.data || [])}
      ${renderAppSection('🔥 Trending Now', trending.data || [])}
      ${renderAppSection('📦 All Apps', allApps.data || [])}
    `;

    // Add event listeners to app cards
    document.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.app-actions')) {
          const id = card.dataset.id;
          if (id) navigateTo('app', id);
        }
      });
    });
  } catch (error) {
    container.innerHTML = '<p class="error">Failed to load apps. Please refresh.</p>';
    console.error(error);
  }
}

// ===== RENDER APP SECTION =====
function renderAppSection(title, apps) {
  if (!apps || apps.length === 0) return '';
  
  return `
    <div class="section-title">
      ${title}
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
        <img src="${app.icon || 'https://via.placeholder.com/64'}" 
             alt="${app.name}" 
             class="app-icon"
             onerror="this.src='https://via.placeholder.com/64'">
        <div style="flex:1;">
          <div class="app-name">${app.name}</div>
          <div class="app-desc">${app.shortDescription || app.name}</div>
          <div class="app-meta">
            <span class="app-rating">⭐ ${app.rating || 0}</span>
            <span>⬇️ ${app.downloads || 0}</span>
            <span class="app-category">${app.category}</span>
          </div>
        </div>
      </div>
      <div class="app-actions">
        <button class="btn-download" onclick="event.stopPropagation(); handleDownload('${app._id}')">
          ⬇️ Download
        </button>
        <button class="btn-fav ${isFavorite ? 'active' : ''}" 
                onclick="event.stopPropagation(); handleFavorite('${app._id}')">
          ❤️
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
          <img src="${app.icon || 'https://via.placeholder.com/120'}" 
               alt="${app.name}" 
               class="icon"
               onerror="this.src='https://via.placeholder.com/120'">
          <div class="info">
            <h1>${app.name}</h1>
            <div class="package">📦 ${app.packageName}</div>
            <div class="meta">
              <span>📌 ${app.version}</span>
              <span>📱 Android ${app.minAndroidVersion}+</span>
              <span>💾 ${app.fileSize}</span>
              <span>⭐ ${app.rating || 0}</span>
              <span>⬇️ ${app.downloads || 0}</span>
            </div>
            <button class="download-btn" onclick="handleDownload('${app._id}')">
              ⬇️ Download APK
            </button>
          </div>
        </div>
        
        <div class="description">
          <h2>📖 Description</h2>
          <p>${app.description || 'No description available.'}</p>
        </div>
        
        ${app.features?.length ? `
          <div class="features">
            <h2>✨ Features</h2>
            <ul>
              ${app.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${app.deployment?.vercel || app.deployment?.render ? `
          <div class="features" style="margin-top:20px;">
            <h2>🚀 Open Online</h2>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
              ${app.deployment.vercel ? `<a href="${app.deployment.vercel}" target="_blank" class="deploy-link vercel">⚡ Vercel</a>` : ''}
              ${app.deployment.render ? `<a href="${app.deployment.render}" target="_blank" class="deploy-link render">🔄 Render</a>` : ''}
              ${app.deployment.netlify ? `<a href="${app.deployment.netlify}" target="_blank" class="deploy-link netlify">🚀 Netlify</a>` : ''}
              ${app.deployment.github ? `<a href="${app.deployment.github}" target="_blank" class="deploy-link github">🐙 GitHub</a>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p>Failed to load app details</p>';
    console.error(error);
  }
}

// ===== RENDER SUBMIT APP =====
function renderSubmitApp(container) {
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

// ===== HANDLERS =====
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const result = await Auth.login(email, password);
  if (result.success) {
    navigateTo('home');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const result = await Auth.register(username, email, password);
  if (result.success) {
    navigateTo('home');
  }
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
    const result = await AppAPI.submit(data, authToken);
    if (result.success) {
      showNotification('✅ App submitted successfully!', 'success');
      navigateTo('home');
    } else {
      showNotification(result.message || 'Submission failed', 'error');
    }
  } catch (error) {
    showNotification('Submission failed', 'error');
    console.error(error);
  }
}

async function handleDownload(appId) {
  if (!Auth.isLoggedIn()) {
    showNotification('Please login to download', 'error');
    navigateTo('login');
    return;
  }
  
  try {
    const result = await api.get(`/apps/download/${appId}`, authToken);
    if (result.success) {
      showNotification('✅ Download started!', 'success');
      // Open download
      window.open(result.downloadUrl, '_blank');
    }
  } catch (error) {
    showNotification('Download failed', 'error');
  }
}

async function handleFavorite(appId) {
  if (!Auth.isLoggedIn()) {
    showNotification('Please login to favorite', 'error');
    navigateTo('login');
    return;
  }
  
  try {
    const result = await AppAPI.toggleFavorite(appId, authToken);
    if (result.success) {
      showNotification('❤️ Updated favorites', 'success');
      // Refresh current view
      const container = document.getElementById('mainContent');
      const currentView = container.dataset.view || 'home';
      navigateTo(currentView);
    }
  } catch (error) {
    showNotification('Failed to update', 'error');
  }
}

// ===== NAVIGATION =====
function navigateTo(page, params = null) {
  const mainContent = document.getElementById('mainContent');
  mainContent.dataset.view = page;
  
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
    case 'submit':
      renderSubmitApp(mainContent);
      break;
    default:
      renderHome(mainContent);
  }
}

// ===== NOTIFICATION =====
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = message;
  document.body.appendChild(div);
  
  setTimeout(() => div.remove(), 3000);
    }
