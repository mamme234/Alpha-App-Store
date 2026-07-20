const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { App } = require('./models');

// ===== GENERATE APK =====
const generateAppAPK = async (appId) => {
  try {
    const app = await App.findById(appId);
    if (!app) throw new Error('App not found');

    const appDir = path.join(__dirname, 'generated-apps', app.packageName);
    await fs.ensureDir(appDir);

    // ===== GENERATE HTML APP =====
    const deploymentLinks = [];
    const deploys = app.deployment || {};
    
    if (deploys.vercel) deploymentLinks.push(`<a href="${deploys.vercel}" target="_blank" class="vercel">⚡ Vercel</a>`);
    if (deploys.render) deploymentLinks.push(`<a href="${deploys.render}" target="_blank" class="render">🔄 Render</a>`);
    if (deploys.netlify) deploymentLinks.push(`<a href="${deploys.netlify}" target="_blank" class="netlify">🚀 Netlify</a>`);
    if (deploys.github) deploymentLinks.push(`<a href="${deploys.github}" target="_blank" class="github">🐙 GitHub</a>`);
    if (deploys.custom) deploymentLinks.push(`<a href="${deploys.custom}" target="_blank" class="custom">🔗 Custom</a>`);

    const featuresHtml = app.features?.length ? `
      <div class="section">
        <h2>✨ Features</h2>
        ${app.features.map(f => `<div class="feature">✓ ${f}</div>`).join('')}
      </div>
    ` : '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#4f46e5">
    <title>${app.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .app-header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .app-header .icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #4f46e5;
        }
        .app-header h1 { font-size: 20px; }
        .app-header p { font-size: 14px; opacity: 0.9; }
        .app-content {
            flex: 1;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }
        .app-content .section {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .app-content .section h2 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #1a1a2e;
        }
        .app-content .section p {
            color: #4b5563;
            line-height: 1.6;
        }
        .app-content .section .feature {
            padding: 8px 12px;
            background: #f3f4f6;
            border-radius: 8px;
            margin: 4px 0;
            font-size: 14px;
        }
        .deployment-links {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        .deployment-links a {
            display: inline-block;
            padding: 10px 20px;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            flex: 1;
            min-width: 100px;
            text-align: center;
            transition: transform 0.2s;
        }
        .deployment-links a:hover { transform: scale(1.05); }
        .deployment-links a.vercel { background: #000; }
        .deployment-links a.render { background: #46d0b0; color: #000; }
        .deployment-links a.netlify { background: #00c7b7; color: #000; }
        .deployment-links a.github { background: #333; }
        .deployment-links a.custom { background: #6b7280; }
        .download-btn {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: 600;
            width: 100%;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.3s;
        }
        .download-btn:hover { background: #4338ca; }
        .bottom-nav {
            background: white;
            border-top: 1px solid #e5e7eb;
            padding: 12px 20px;
            display: flex;
            justify-content: space-around;
            position: sticky;
            bottom: 0;
        }
        .bottom-nav button {
            background: none;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            color: #6b7280;
            cursor: pointer;
        }
        .bottom-nav button.active {
            color: #4f46e5;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="app-header">
        <div class="icon">📱</div>
        <div>
            <h1>${app.name}</h1>
            <p>${app.shortDescription || ''}</p>
        </div>
    </div>

    <div class="app-content">
        <div class="section">
            <h2>📖 Description</h2>
            <p>${app.description || 'No description available.'}</p>
        </div>

        ${featuresHtml}

        ${deploymentLinks.length > 0 ? `
        <div class="section">
            <h2>🚀 Open App</h2>
            <p style="margin-bottom:12px;">Click to open this app:</p>
            <div class="deployment-links">
                ${deploymentLinks.join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>📥 Download APK</h2>
            <button class="download-btn" onclick="window.location.href='/api/apps/download/${app.packageName}'">
                ⬇️ Download APK (${app.fileSize || '5MB'})
            </button>
            <p style="margin-top:12px;font-size:14px;color:#6b7280;text-align:center;">
                Version ${app.version} • Android ${app.minAndroidVersion || '5.0'}+
            </p>
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
            btn.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#4f46e5;color:white;border:none;padding:12px 24px;border-radius:30px;font-weight:600;z-index:999;cursor:pointer;';
            btn.onclick = async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const result = await deferredPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                        alert('App installed successfully!');
                    }
                    deferredPrompt = null;
                }
            };
            document.body.appendChild(btn);
        });
    </script>
</body>
</html>
`;

    await fs.writeFile(path.join(appDir, 'index.html'), htmlContent);

    // ===== MANIFEST =====
    const manifest = {
      name: app.name,
      short_name: app.name.substring(0, 12),
      description: app.shortDescription || app.name,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#4f46e5',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    };
    await fs.writeFile(path.join(appDir, 'manifest.json'), JSON.stringify(manifest));

    // ===== SERVICE WORKER =====
    const sw = `
self.addEventListener('install', e => {
  e.waitUntil(caches.open('app-v1').then(c => c.addAll(['/','/index.html'])));
  self.skipWaiting();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
`;
    await fs.writeFile(path.join(appDir, 'sw.js'), sw);

    // ===== CREATE APK (ZIP) =====
    const apkPath = path.join(__dirname, 'generated-apps', `${app.packageName}.apk`);
    const zipPath = path.join(__dirname, 'generated-apps', `${app.packageName}.zip`);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(appDir, '');
      archive.finalize();
    });

    await fs.copy(zipPath, apkPath);
    await fs.remove(zipPath);

    // ===== UPDATE APP =====
    app.generated = true;
    app.generatedApkPath = `generated-apps/${app.packageName}.apk`;
    app.apkUrl = `/generated/${app.packageName}.apk`;
    app.status = 'generated';
    await app.save();

    console.log(`✅ APK generated for ${app.name}`);
    return { success: true, apkPath };

  } catch (error) {
    console.error('APK Generation Error:', error);
    throw error;
  }
};

module.exports = { generateAppAPK };
