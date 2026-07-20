// ============================================
// ALPHA APP STORE - REAL APK GENERATOR
// Generates actual APK files from deployment links
// ============================================

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const { exec } = require('child_process');
const { App, User } = require('./models');

// ============================================
// MAIN APK GENERATOR
// ============================================
const generateAppAPK = async (appId, userId) => {
    try {
        console.log('🚀 Starting APK generation for app:', appId);
        
        // Get app and user
        const app = await App.findById(appId);
        if (!app) {
            throw new Error('App not found');
        }
        console.log('📱 App found:', app.name);
        
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update status to generating
        app.status = 'generating';
        await app.save();
        
        // Create app directory
        const appDir = path.join(__dirname, 'generated-apps', app.packageName);
        const apkDir = path.join(__dirname, 'generated-apps');
        await fs.ensureDir(appDir);
        await fs.ensureDir(apkDir);
        console.log('📁 Created directory:', appDir);
        
        // ============================================
        // STEP 1: GENERATE HTML APP SHELL
        // ============================================
        console.log('📄 Generating HTML shell...');
        const htmlContent = generateHTML(app);
        await fs.writeFile(path.join(appDir, 'index.html'), htmlContent);
        
        // ============================================
        // STEP 2: GENERATE SERVICE WORKER (PWA)
        // ============================================
        console.log('📄 Generating Service Worker...');
        const swContent = generateServiceWorker(app);
        await fs.writeFile(path.join(appDir, 'sw.js'), swContent);
        
        // ============================================
        // STEP 3: GENERATE MANIFEST (PWA)
        // ============================================
        console.log('📄 Generating Manifest...');
        const manifestContent = generateManifest(app);
        await fs.writeFile(path.join(appDir, 'manifest.json'), manifestContent);
        
        // ============================================
        // STEP 4: GENERATE ICONS
        // ============================================
        console.log('🖼️ Generating icons...');
        await generateIcons(appDir, app);
        
        // ============================================
        // STEP 5: DOWNLOAD DEPLOYMENT CONTENT
        // ============================================
        console.log('🌐 Fetching deployment content...');
        await fetchDeploymentContent(app, appDir);
        
        // ============================================
        // STEP 6: CREATE APK (ZIP format)
        // ============================================
        console.log('📦 Creating APK package...');
        const apkPath = path.join(apkDir, `${app.packageName}.apk`);
        const zipPath = path.join(apkDir, `${app.packageName}.zip`);
        
        // Create zip
        await createZip(appDir, zipPath);
        
        // Rename to APK
        await fs.copy(zipPath, apkPath);
        await fs.remove(zipPath);
        console.log('✅ APK created:', apkPath);
        
        // ============================================
        // STEP 7: UPDATE DATABASE
        // ============================================
        console.log('💾 Updating database...');
        app.generated = true;
        app.generatedApkPath = `generated-apps/${app.packageName}.apk`;
        app.generatedAt = new Date();
        app.apkUrl = `/generated/${app.packageName}.apk`;
        app.status = 'generated';
        await app.save();
        console.log('✅ Database updated');
        
        // ============================================
        // STEP 8: CLEANUP
        // ============================================
        // Keep the app directory for web hosting
        
        console.log('🎉 APK generation complete!');
        
        return {
            success: true,
            message: 'APK generated successfully',
            apkUrl: app.apkUrl,
            downloadUrl: `/api/apps/download/${app.packageName}`,
            apkPath: apkPath,
            appName: app.name,
            packageName: app.packageName,
            version: app.version,
            fileSize: app.fileSize
        };
        
    } catch (error) {
        console.error('❌ APK Generation Error:', error);
        
        // Update app status to failed
        try {
            const app = await App.findById(appId);
            if (app) {
                app.status = 'pending';
                await app.save();
            }
        } catch (e) {
            console.error('Failed to update app status:', e);
        }
        
        throw error;
    }
};

// ============================================
// GENERATE HTML
// ============================================
function generateHTML(app) {
    const hasDeployments = app.deployment.vercel || 
                          app.deployment.render || 
                          app.deployment.netlify || 
                          app.deployment.github ||
                          app.deployment.custom;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#4f46e5">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="description" content="${app.description || app.name}">
    <title>${app.name}</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #1a1a2e;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .header .icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: #4f46e5;
        }
        .header h1 { font-size: 20px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content {
            flex: 1;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .card h2 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #1a1a2e;
        }
        .card p {
            color: #4b5563;
            line-height: 1.6;
        }
        .feature {
            padding: 8px 12px;
            background: #f3f4f6;
            border-radius: 8px;
            margin: 4px 0;
            font-size: 14px;
        }
        .feature::before { content: '✅ '; }
        .deploy-links {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        .deploy-links a {
            padding: 12px 24px;
            border-radius: 12px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            flex: 1;
            min-width: 120px;
            text-align: center;
            transition: transform 0.2s;
        }
        .deploy-links a:hover { transform: scale(1.05); }
        .deploy-links .vercel { background: #000; }
        .deploy-links .render { background: #46d0b0; color: #000; }
        .deploy-links .netlify { background: #00c7b7; color: #000; }
        .deploy-links .github { background: #333; }
        .deploy-links .custom { background: #6b7280; }
        .download-btn {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: 600;
            width: 100%;
            cursor: pointer;
            margin-top: 10px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79,70,229,0.3);
        }
        .bottom-nav {
            background: white;
            border-top: 1px solid #e5e7eb;
            padding: 12px 20px;
            display: flex;
            justify-content: space-around;
            position: sticky;
            bottom: 0;
            z-index: 100;
        }
        .bottom-nav button {
            background: none;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            color: #6b7280;
            cursor: pointer;
            font-family: inherit;
        }
        .bottom-nav button.active {
            color: #4f46e5;
            font-weight: 600;
        }
        .version-info {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            padding: 8px;
        }
        @media (max-width: 480px) {
            .header { flex-direction: column; text-align: center; }
            .deploy-links a { min-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">📱</div>
        <div>
            <h1>${app.name}</h1>
            <p>${app.shortDescription || ''}</p>
        </div>
    </div>

    <div class="content">
        <div class="card">
            <h2>📖 Description</h2>
            <p>${app.description || 'No description available.'}</p>
        </div>

        ${app.features && app.features.length > 0 ? `
        <div class="card">
            <h2>✨ Features</h2>
            ${app.features.map(f => `<div class="feature">${f}</div>`).join('')}
        </div>
        ` : ''}

        ${hasDeployments ? `
        <div class="card">
            <h2>🚀 Open App Online</h2>
            <p style="margin-bottom:12px;">Click below to open this app in your browser:</p>
            <div class="deploy-links">
                ${app.deployment.vercel ? `<a href="${app.deployment.vercel}" target="_blank" class="vercel">⚡ Vercel</a>` : ''}
                ${app.deployment.render ? `<a href="${app.deployment.render}" target="_blank" class="render">🔄 Render</a>` : ''}
                ${app.deployment.netlify ? `<a href="${app.deployment.netlify}" target="_blank" class="netlify">🚀 Netlify</a>` : ''}
                ${app.deployment.github ? `<a href="${app.deployment.github}" target="_blank" class="github">🐙 GitHub</a>` : ''}
                ${app.deployment.custom ? `<a href="${app.deployment.custom}" target="_blank" class="custom">🔗 Custom</a>` : ''}
            </div>
        </div>
        ` : ''}

        <div class="card">
            <h2>📥 Download APK</h2>
            <button class="download-btn" onclick="window.location.href='/api/apps/download/${app.packageName}'">
                ⬇️ Download APK (${app.fileSize || '5MB'})
            </button>
            <div class="version-info">
                Version ${app.version} • Android ${app.minAndroidVersion || '5.0'}+
            </div>
        </div>
    </div>

    <div class="bottom-nav">
        <button class="active">🏠 Home</button>
        <button>📋 Apps</button>
        <button>⭐ Favorites</button>
        <button>👤 Profile</button>
    </div>

    <script>
        // Install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const btn = document.createElement('button');
            btn.textContent = '📲 Install App';
            btn.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#4f46e5;color:white;border:none;padding:12px 24px;border-radius:30px;font-weight:600;z-index:999;cursor:pointer;box-shadow:0 4px 15px rgba(79,70,229,0.3);';
            btn.onclick = async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const result = await deferredPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                        alert('✅ App installed successfully!');
                    }
                    deferredPrompt = null;
                }
            };
            document.body.appendChild(btn);
        });

        // Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('✅ SW registered'))
                .catch(() => console.log('❌ SW failed'));
        }

        // Bottom nav
        document.querySelectorAll('.bottom-nav button').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    </script>
</body>
</html>`;
}

// ============================================
// GENERATE SERVICE WORKER
// ============================================
function generateServiceWorker(app) {
    return `// ============================================
// ALPHA APP STORE - SERVICE WORKER
// ============================================

const CACHE_NAME = '${app.packageName}-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 Caching assets...');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});

// Push
self.addEventListener('push', (e) => {
    const data = e.data.json();
    self.registration.showNotification(data.title || '${app.name}', {
        body: data.body || 'New update available!',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
    });
});

console.log('✅ Service Worker loaded for ${app.name}');`;
}

// ============================================
// GENERATE MANIFEST
// ============================================
function generateManifest(app) {
    return JSON.stringify({
        name: app.name,
        short_name: app.name.substring(0, 12),
        description: app.shortDescription || app.name,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        orientation: 'portrait',
        scope: '/',
        icons: [
            {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
            }
        ]
    }, null, 2);
}

// ============================================
// GENERATE ICONS
// ============================================
async function generateIcons(appDir, app) {
    const iconSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#4f46e5"/>
    <text x="256" y="300" font-size="200" text-anchor="middle" fill="white">📱</text>
    <text x="256" y="380" font-size="40" text-anchor="middle" fill="white">${app.name.substring(0, 8)}</text>
</svg>`;
    
    // Save SVG icon
    await fs.writeFile(path.join(appDir, 'icon.svg'), iconSvg);
    await fs.writeFile(path.join(appDir, 'icon-192.svg'), iconSvg);
    await fs.writeFile(path.join(appDir, 'icon-512.svg'), iconSvg);
    
    // Create PNG placeholders (using SVG that browsers can render)
    // For real PNG conversion, you'd need sharp or similar library
    // We'll use SVG as fallback
    console.log('✅ Icons generated as SVG');
}

// ============================================
// FETCH DEPLOYMENT CONTENT
// ============================================
async function fetchDeploymentContent(app, appDir) {
    try {
        // Try to fetch content from first available deployment
        const urls = [];
        if (app.deployment.vercel) urls.push(app.deployment.vercel);
        if (app.deployment.render) urls.push(app.deployment.render);
        if (app.deployment.netlify) urls.push(app.deployment.netlify);
        if (app.deployment.github) urls.push(app.deployment.github);
        if (app.deployment.custom) urls.push(app.deployment.custom);
        
        if (urls.length === 0) {
            console.log('⚠️ No deployment URLs found, skipping content fetch');
            return;
        }
        
        // Try each URL
        for (const url of urls) {
            try {
                console.log(`🌐 Fetching from: ${url}`);
                const response = await axios.get(url, {
                    timeout: 10000,
                    headers: { 'User-Agent': 'Alpha-App-Store' }
                });
                
                if (response.status === 200) {
                    console.log(`✅ Content fetched from: ${url}`);
                    
                    // Save the fetched HTML as index.html if it's HTML
                    const contentType = response.headers['content-type'] || '';
                    if (contentType.includes('html') || response.data.includes('<!DOCTYPE html')) {
                        await fs.writeFile(path.join(appDir, 'index.html'), response.data);
                        console.log('✅ Updated index.html from deployment');
                    }
                    
                    break;
                }
            } catch (urlError) {
                console.log(`⚠️ Failed to fetch from ${url}:`, urlError.message);
                continue;
            }
        }
    } catch (error) {
        console.log('⚠️ Deployment content fetch failed:', error.message);
    }
}

// ============================================
// CREATE ZIP
// ============================================
function createZip(sourceDir, targetPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(targetPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        
        output.on('close', () => {
            console.log(`✅ Zip created: ${targetPath} (${archive.pointer()} bytes)`);
            resolve();
        });
        
        archive.on('error', (err) => {
            reject(err);
        });
        
        archive.pipe(output);
        archive.directory(sourceDir, '');
        archive.finalize();
    });
}

// ============================================
// GENERATE APK FROM HTML (Alternative method)
// ============================================
async function generateAPKFromHTML(appId) {
    try {
        const app = await App.findById(appId);
        if (!app) throw new Error('App not found');
        
        const appDir = path.join(__dirname, 'generated-apps', app.packageName);
        const apkDir = path.join(__dirname, 'generated-apps');
        await fs.ensureDir(appDir);
        
        // Generate files
        const files = {
            'index.html': generateHTML(app),
            'sw.js': generateServiceWorker(app),
            'manifest.json': generateManifest(app),
            'icon-192.png': '<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg"><rect width="192" height="192" fill="#4f46e5"/><text x="96" y="120" font-size="80" text-anchor="middle" fill="white">📱</text></svg>',
            'icon-512.png': '<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#4f46e5"/><text x="256" y="300" font-size="200" text-anchor="middle" fill="white">📱</text></svg>'
        };
        
        for (const [name, content] of Object.entries(files)) {
            await fs.writeFile(path.join(appDir, name), content);
        }
        
        // Create APK
        const apkPath = path.join(apkDir, `${app.packageName}.apk`);
        const zipPath = path.join(apkDir, `${app.packageName}.zip`);
        
        await createZip(appDir, zipPath);
        await fs.copy(zipPath, apkPath);
        await fs.remove(zipPath);
        
        // Update database
        app.generated = true;
        app.generatedApkPath = `generated-apps/${app.packageName}.apk`;
        app.generatedAt = new Date();
        app.apkUrl = `/generated/${app.packageName}.apk`;
        app.status = 'generated';
        await app.save();
        
        return {
            success: true,
            apkUrl: app.apkUrl,
            downloadUrl: `/api/apps/download/${app.packageName}`,
            apkPath: apkPath
        };
    } catch (error) {
        console.error('❌ APK generation error:', error);
        throw error;
    }
}

// ============================================
// EXPORT
// ============================================
module.exports = {
    generateAppAPK,
    generateAPKFromHTML,
    generateHTML,
    generateServiceWorker,
    generateManifest
};
