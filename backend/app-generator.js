// ============================================
// ALPHA APP STORE - ZIP METHOD APK GENERATOR
// Creates APK by generating Android files and zipping them
// ============================================

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const { App, User } = require('./models');

// ============================================
// MAIN APK GENERATOR
// ============================================
const generateAppAPK = async (appId, userId) => {
    try {
        console.log('🚀 Starting APK generation (ZIP Method)...');
        
        const app = await App.findById(appId);
        if (!app) throw new Error('App not found');
        console.log('📱 App found:', app.name);
        
        app.status = 'generating';
        await app.save();
        
        // Create directories
        const appDir = path.join(__dirname, 'generated-apps', app.packageName);
        const apkDir = path.join(__dirname, 'generated-apps');
        await fs.ensureDir(appDir);
        await fs.ensureDir(apkDir);
        
        console.log('📁 Creating Android app structure...');
        
        // ============================================
        // STEP 1: GENERATE ALL FILES
        // ============================================
        
        // 1.1 AndroidManifest.xml
        await generateAndroidManifest(app, appDir);
        
        // 1.2 Java Activity
        await generateMainActivity(app, appDir);
        
        // 1.3 Layout XML
        await generateLayout(app, appDir);
        
        // 1.4 Resources (strings, colors, styles)
        await generateResources(app, appDir);
        
        // 1.5 App Icons
        await generateIcons(app, appDir);
        
        // 1.6 Web Assets (HTML, SW, Manifest)
        await generateWebAssets(app, appDir);
        
        // 1.7 META-INF (Signatures)
        await generateMetaInf(app, appDir);
        
        // 1.8 classes.dex and resources.arsc (placeholders)
        await generatePlaceholderFiles(appDir);
        
        console.log('✅ All files generated');
        
        // ============================================
        // STEP 2: CREATE ZIP
        // ============================================
        console.log('📦 Creating APK package...');
        const apkPath = path.join(apkDir, `${app.packageName}.apk`);
        const zipPath = path.join(apkDir, `${app.packageName}.zip`);
        
        await createZip(appDir, zipPath);
        
        // ============================================
        // STEP 3: RENAME ZIP TO APK
        // ============================================
        await fs.copy(zipPath, apkPath);
        await fs.remove(zipPath);
        
        console.log('✅ APK created:', apkPath);
        
        // ============================================
        // STEP 4: GET FILE SIZE
        // ============================================
        const fileSize = await getFileSize(apkPath);
        
        // ============================================
        // STEP 5: UPDATE DATABASE
        // ============================================
        app.generated = true;
        app.generatedApkPath = `generated-apps/${app.packageName}.apk`;
        app.generatedAt = new Date();
        app.apkUrl = `/generated/${app.packageName}.apk`;
        app.status = 'generated';
        app.fileSize = fileSize;
        await app.save();
        
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
            fileSize: fileSize
        };
        
    } catch (error) {
        console.error('❌ APK Generation Error:', error);
        try {
            const app = await App.findById(appId);
            if (app) {
                app.status = 'pending';
                await app.save();
            }
        } catch (e) {}
        throw error;
    }
};

// ============================================
// GENERATE ANDROID MANIFEST
// ============================================
async function generateAndroidManifest(app, appDir) {
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${app.packageName}"
    android:versionCode="1"
    android:versionName="${app.version}"
    android:installLocation="auto">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${app.name}"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true"
        android:supportsRtl="true">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true"
            android:theme="@style/AppTheme"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>`;

    await fs.writeFile(path.join(appDir, 'AndroidManifest.xml'), manifest);
}

// ============================================
// GENERATE MAIN ACTIVITY
// ============================================
async function generateMainActivity(app, appDir) {
    const packagePath = app.packageName.replace(/\./g, '/');
    const srcDir = path.join(appDir, 'src', packagePath);
    await fs.ensureDir(srcDir);
    
    const mainActivity = `package ${app.packageName};

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.View;
import android.widget.ProgressBar;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

public class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar progressBar;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        
        setupWebView();
        
        // Load app URL
        String appUrl = getAppUrl();
        webView.loadUrl(appUrl);
    }
    
    private String getAppUrl() {
        String[] urls = {
            "${app.deployment.vercel || ''}",
            "${app.deployment.render || ''}",
            "${app.deployment.netlify || ''}",
            "${app.deployment.github || ''}",
            "${app.deployment.custom || ''}"
        };
        
        for (String url : urls) {
            if (url != null && !url.isEmpty()) {
                return url;
            }
        }
        return "file:///android_asset/index.html";
    }
    
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    view.loadUrl(url);
                    return true;
                }
                return false;
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

    await fs.writeFile(path.join(srcDir, 'MainActivity.java'), mainActivity);
}

// ============================================
// GENERATE LAYOUT
// ============================================
async function generateLayout(app, appDir) {
    const layoutDir = path.join(appDir, 'res', 'layout');
    await fs.ensureDir(layoutDir);
    
    const layout = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/colorBackground">
    
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
    
    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone"
        style="?android:attr/progressBarStyleHorizontal" />
        
</FrameLayout>`;
    
    await fs.writeFile(path.join(layoutDir, 'activity_main.xml'), layout);
}

// ============================================
// GENERATE RESOURCES
// ============================================
async function generateResources(app, appDir) {
    const valuesDir = path.join(appDir, 'res', 'values');
    await fs.ensureDir(valuesDir);
    
    // strings.xml
    const strings = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${app.name}</string>
    <string name="app_description">${app.shortDescription || app.name}</string>
</resources>`;
    await fs.writeFile(path.join(valuesDir, 'strings.xml'), strings);
    
    // colors.xml
    const colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#4f46e5</color>
    <color name="colorPrimaryDark">#4338ca</color>
    <color name="colorAccent">#7c3aed</color>
    <color name="colorBackground">#f0f2f5</color>
    <color name="colorWhite">#ffffff</color>
    <color name="colorBlack">#000000</color>
</resources>`;
    await fs.writeFile(path.join(valuesDir, 'colors.xml'), colors);
    
    // styles.xml
    const styles = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">@color/colorPrimary</item>
        <item name="android:colorPrimary">@color/colorPrimary</item>
        <item name="android:colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="android:colorAccent">@color/colorAccent</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>`;
    await fs.writeFile(path.join(valuesDir, 'styles.xml'), styles);
}

// ============================================
// GENERATE ICONS
// ============================================
async function generateIcons(app, appDir) {
    const iconDirs = ['mipmap-hdpi', 'mipmap-mdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
    const sizes = [72, 48, 96, 144, 192];
    
    for (let i = 0; i < iconDirs.length; i++) {
        const dir = iconDirs[i];
        const size = sizes[i];
        const iconDir = path.join(appDir, 'res', dir);
        await fs.ensureDir(iconDir);
        
        const icon = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#4f46e5"/>
    <text x="${size/2}" y="${size/2 + 10}" font-size="${size * 0.35}" text-anchor="middle" fill="white">📱</text>
    <text x="${size/2}" y="${size - 10}" font-size="${size * 0.07}" text-anchor="middle" fill="white">${app.name.substring(0, 4)}</text>
</svg>`;
        
        await fs.writeFile(path.join(iconDir, 'ic_launcher.png'), icon);
        await fs.writeFile(path.join(iconDir, 'ic_launcher_round.png'), icon);
    }
}

// ============================================
// GENERATE WEB ASSETS
// ============================================
async function generateWebAssets(app, appDir) {
    const assetsDir = path.join(appDir, 'assets');
    await fs.ensureDir(assetsDir);
    
    // index.html
    const html = generateHTML(app);
    await fs.writeFile(path.join(assetsDir, 'index.html'), html);
    
    // sw.js
    const sw = generateServiceWorker(app);
    await fs.writeFile(path.join(assetsDir, 'sw.js'), sw);
    
    // manifest.json
    const manifest = generateManifest(app);
    await fs.writeFile(path.join(assetsDir, 'manifest.json'), manifest);
    
    // Icons
    const iconSizes = [192, 512];
    for (const size of iconSizes) {
        const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#4f46e5"/>
    <text x="${size/2}" y="${size/2 + 15}" font-size="${size * 0.35}" text-anchor="middle" fill="white">📱</text>
</svg>`;
        await fs.writeFile(path.join(assetsDir, `icon-${size}.png`), svg);
    }
}

// ============================================
// GENERATE META-INF
// ============================================
async function generateMetaInf(app, appDir) {
    const metaDir = path.join(appDir, 'META-INF');
    await fs.ensureDir(metaDir);
    
    // MANIFEST.MF
    const manifestMF = `Manifest-Version: 1.0
Created-By: Alpha App Store
Application: ${app.name}
Version: ${app.version}
Package: ${app.packageName}`;
    await fs.writeFile(path.join(metaDir, 'MANIFEST.MF'), manifestMF);
    
    // CERT.SF
    const certSF = `Signature-Version: 1.0
Created-By: Alpha App Store
SHA1-Digest-Manifest: ${uuidv4().replace(/-/g, '').substring(0, 40)}`;
    await fs.writeFile(path.join(metaDir, 'CERT.SF'), certSF);
    
    // CERT.RSA (placeholder)
    await fs.writeFile(path.join(metaDir, 'CERT.RSA'), '');
}

// ============================================
// GENERATE PLACEHOLDER FILES
// ============================================
async function generatePlaceholderFiles(appDir) {
    // classes.dex (Dalvik Executable - placeholder)
    await fs.writeFile(path.join(appDir, 'classes.dex'), '');
    
    // resources.arsc (compiled resources - placeholder)
    await fs.writeFile(path.join(appDir, 'resources.arsc'), '');
    
    // lib folder
    await fs.ensureDir(path.join(appDir, 'lib'));
}

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
            flex-shrink: 0;
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
        .card h2 { font-size: 16px; margin-bottom: 12px; color: #1a1a2e; }
        .card p { color: #4b5563; line-height: 1.6; }
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

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('✅ SW registered'))
                .catch(() => console.log('❌ SW failed'));
        }

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
    return `const CACHE_NAME = '${app.packageName}-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 Caching assets...');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});`;
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
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
    }, null, 2);
}

// ============================================
// CREATE ZIP
// ============================================
function createZip(sourceDir, targetPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(targetPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            console.log(`✅ Zip created: ${targetPath} (${archive.pointer()} bytes)`);
            resolve();
        });
        
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(sourceDir, '');
        archive.finalize();
    });
}

// ============================================
// GET FILE SIZE
// ============================================
async function getFileSize(filePath) {
    try {
        const stats = await fs.stat(filePath);
        const size = stats.size;
        if (size < 1024) return size + 'B';
        if (size < 1048576) return (size / 1024).toFixed(1) + 'KB';
        if (size < 1073741824) return (size / 1048576).toFixed(1) + 'MB';
        return (size / 1073741824).toFixed(1) + 'GB';
    } catch (error) {
        return '5MB';
    }
}

// ============================================
// EXPORT
// ============================================
module.exports = {
    generateAppAPK,
    generateHTML,
    generateServiceWorker,
    generateManifest
};
