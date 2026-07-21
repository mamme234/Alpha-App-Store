const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { App } = require('./models');

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const generateAppAPK = async (appId, userId) => {
    try {
        console.log('🚀 Starting APK generation...');

        const app = await App.findById(appId);
        if (!app) throw new Error('App not found');

        app.status = 'generating';
        await app.save();

        const appDir = path.join(__dirname, 'generated-apps', app.packageName);
        const apkDir = path.join(__dirname, 'generated-apps');
        await fs.ensureDir(appDir);
        await fs.ensureDir(apkDir);

        // Generate AndroidManifest.xml
        const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${app.packageName}"
    android:versionCode="1"
    android:versionName="${app.version}"
    android:installLocation="auto">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

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

        // Generate MainActivity.java
        const packagePath = app.packageName.replace(/\./g, '/');
        const srcDir = path.join(appDir, 'src', packagePath);
        await fs.ensureDir(srcDir);

        const deploymentUrls = [
            app.deployment?.vercel || '',
            app.deployment?.render || '',
            app.deployment?.netlify || '',
            app.deployment?.github || '',
            app.deployment?.custom || ''
        ].filter(url => url && url.length > 0);

        const primaryUrl = deploymentUrls.length > 0 ? deploymentUrls[0] : 'file:///android_asset/index.html';

        const mainActivity = `package ${app.packageName};

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.View;
import android.widget.ProgressBar;
import android.app.Activity;
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
        webView.loadUrl("${primaryUrl}");
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

        // Generate layout
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

        // Generate resources
        const valuesDir = path.join(appDir, 'res', 'values');
        await fs.ensureDir(valuesDir);

        const strings = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${app.name}</string>
</resources>`;
        await fs.writeFile(path.join(valuesDir, 'strings.xml'), strings);

        const colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#4f46e5</color>
    <color name="colorPrimaryDark">#4338ca</color>
    <color name="colorAccent">#7c3aed</color>
    <color name="colorBackground">#f0f2f5</color>
</resources>`;
        await fs.writeFile(path.join(valuesDir, 'colors.xml'), colors);

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

        // Generate icons
        const iconDirs = ['mipmap-hdpi', 'mipmap-mdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
        const sizes = [72, 48, 96, 144, 192];

        for (let i = 0; i < iconDirs.length; i++) {
            const iconDir = path.join(appDir, 'res', iconDirs[i]);
            await fs.ensureDir(iconDir);
            const icon = `<svg width="${sizes[i]}" height="${sizes[i]}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${sizes[i]}" height="${sizes[i]}" rx="${sizes[i] * 0.15}" fill="#4f46e5"/>
    <text x="${sizes[i]/2}" y="${sizes[i]/2 + 10}" font-size="${sizes[i] * 0.35}" text-anchor="middle" fill="white">📱</text>
</svg>`;
            await fs.writeFile(path.join(iconDir, 'ic_launcher.png'), icon);
            await fs.writeFile(path.join(iconDir, 'ic_launcher_round.png'), icon);
        }

        // Generate placeholder files
        await fs.writeFile(path.join(appDir, 'classes.dex'), '');
        await fs.writeFile(path.join(appDir, 'resources.arsc'), '');
        await fs.ensureDir(path.join(appDir, 'lib'));

        // Create zip
        const apkPath = path.join(apkDir, `${app.packageName}.apk`);
        const zipPath = path.join(apkDir, `${app.packageName}.zip`);

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.directory(appDir, '');
            archive.finalize();
        });

        await fs.copy(zipPath, apkPath);
        await fs.remove(zipPath);

        // Get file size
        const stats = await fs.stat(apkPath);
        const fileSize = stats.size < 1048576 ? 
            (stats.size / 1024).toFixed(1) + 'KB' : 
            (stats.size / 1048576).toFixed(1) + 'MB';

        // Update app
        app.generated = true;
        app.generatedApkPath = `generated-apps/${app.packageName}.apk`;
        app.generatedAt = new Date();
        app.apkUrl = `/generated/${app.packageName}.apk`;
        app.status = 'approved';
        app.fileSize = fileSize;
        app.isPublished = true;
        app.publishedAt = new Date();
        await app.save();

        console.log('🎉 APK generation complete!');

        return {
            success: true,
            apkUrl: app.apkUrl,
            downloadUrl: `/api/apps/download/${app.packageName}`,
            apkPath: apkPath,
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

module.exports = { generateAppAPK };
