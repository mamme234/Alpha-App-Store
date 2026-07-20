const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, App } = require('./models');
const { generateAppAPK } = require('./app-generator');
const fs = require('fs-extra');
const path = require('path');

// ===== AUTH MIDDLEWARE =====
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

// ============================================
// AUTH ROUTES
// ============================================
router.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email and password'
            });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        const user = new User({
            username,
            email,
            password,
            role: role || 'user'
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    favorites: user.favorites || []
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    favorites: user.favorites || []
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
});

router.get('/auth/me', protect, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
});

// ============================================
// APP ROUTES
// ============================================

// GET ALL APPS
router.get('/apps', async (req, res) => {
    try {
        const { category, limit = 50, search } = req.query;
        
        let query = { status: { $in: ['approved', 'generated'] } };
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } }
            ];
        }
        
        const apps = await App.find(query)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .populate('developer', 'username avatar');
        
        res.status(200).json({
            success: true,
            data: apps,
            count: apps.length
        });
    } catch (error) {
        console.error('Get apps error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch apps'
        });
    }
});

// GET FEATURED APPS
router.get('/apps/featured', async (req, res) => {
    try {
        const apps = await App.find({ 
            featured: true, 
            status: { $in: ['approved', 'generated'] } 
        })
        .limit(10)
        .sort({ createdAt: -1 })
        .populate('developer', 'username avatar');
        
        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        console.error('Get featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured apps'
        });
    }
});

// GET TRENDING APPS
router.get('/apps/trending', async (req, res) => {
    try {
        const apps = await App.find({ 
            trending: true, 
            status: { $in: ['approved', 'generated'] } 
        })
        .limit(10)
        .sort({ downloads: -1, createdAt: -1 })
        .populate('developer', 'username avatar');
        
        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending apps'
        });
    }
});

// GET SINGLE APP
router.get('/apps/:id', async (req, res) => {
    try {
        const identifier = req.params.id;
        
        // Try to find by packageName first
        let app = await App.findOne({ packageName: identifier })
            .populate('developer', 'username avatar email');
        
        // If not found, try by _id
        if (!app && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            app = await App.findById(identifier)
                .populate('developer', 'username avatar email');
        }
        
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: app
        });
    } catch (error) {
        console.error('Get app error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch app: ' + error.message
        });
    }
});

// ============================================
// SUBMIT APP - GENERATE APK
// ============================================
router.post('/apps/submit', protect, async (req, res) => {
    try {
        console.log('📝 App submission received');
        
        const {
            name, packageName, description, shortDescription,
            category, version, fileSize, fileSizeBytes,
            minAndroidVersion, deployment, features, permissions
        } = req.body;

        // Validate required fields
        if (!name || !packageName || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, package name and category are required'
            });
        }

        // Validate package name format
        if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid package name format. Use reverse domain (e.g., com.example.app)'
            });
        }

        // Check if app exists
        const existing = await App.findOne({ packageName });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'App already exists with this package name'
            });
        }

        // Check if at least one deployment URL is provided
        const hasDeployment = deployment && (
            deployment.vercel || 
            deployment.render || 
            deployment.netlify || 
            deployment.github || 
            deployment.custom
        );

        if (!hasDeployment) {
            return res.status(400).json({
                success: false,
                message: 'At least one deployment URL is required for APK generation'
            });
        }

        // Create app
        const app = new App({
            name,
            packageName,
            description: description || 'No description available',
            shortDescription: shortDescription || name.substring(0, 160),
            category,
            version: version || '1.0.0',
            fileSize: fileSize || '5MB',
            fileSizeBytes: fileSizeBytes || 5242880,
            minAndroidVersion: minAndroidVersion || '5.0',
            developer: req.user._id,
            deployment: {
                vercel: deployment?.vercel || '',
                render: deployment?.render || '',
                netlify: deployment?.netlify || '',
                github: deployment?.github || '',
                custom: deployment?.custom || ''
            },
            features: features && features.length > 0 ? features : ['Fast loading', 'User friendly', 'Secure'],
            permissions: permissions || ['Internet', 'Storage'],
            status: 'generating',
            generated: false
        });

        await app.save();
        console.log('✅ App created in database');

        // ============================================
        // GENERATE APK USING ZIP METHOD
        // ============================================
        console.log('🚀 Generating APK...');
        
        try {
            const result = await generateAppAPK(app._id, req.user._id);
            console.log('✅ APK generated successfully');
            
            // Update app with generation details
            app.generated = true;
            app.generatedApkPath = result.apkPath || `generated-apps/${app.packageName}.apk`;
            app.generatedAt = new Date();
            app.apkUrl = result.apkUrl || `/generated/${app.packageName}.apk`;
            app.fileSize = result.fileSize || app.fileSize;
            app.status = 'approved';
            
            // If it's the first app, make it featured
            const appCount = await App.countDocuments({ status: 'approved' });
            if (appCount <= 1) {
                app.featured = true;
                app.trending = true;
            }
            
            await app.save();
            
            res.status(201).json({
                success: true,
                message: 'App submitted and APK generated successfully!',
                data: {
                    app: app,
                    apkUrl: result.apkUrl,
                    downloadUrl: `/api/apps/download/${app.packageName}`,
                    apkPath: result.apkPath,
                    fileSize: result.fileSize
                }
            });
        } catch (genError) {
            console.error('❌ APK generation failed:', genError);
            app.status = 'pending';
            app.generated = false;
            await app.save();
            
            res.status(201).json({
                success: true,
                message: 'App submitted but APK generation failed. Please try again.',
                warning: genError.message,
                data: { app }
            });
        }

    } catch (error) {
        console.error('❌ Submit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit app: ' + error.message
        });
    }
});

// ============================================
// DOWNLOAD APK - FIXED
// ============================================
router.get('/apps/download/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        console.log(`📥 Download request for: ${identifier}`);
        
        // Try to find by packageName first
        let app = await App.findOne({ packageName: identifier });
        
        // If not found by packageName, try by _id
        if (!app && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            app = await App.findById(identifier);
        }
        
        if (!app) {
            return res.status(404).json({
                success: false,
                message: `App not found with identifier: ${identifier}`
            });
        }

        // Build APK path
        let apkPath = app.generatedApkPath || `generated-apps/${app.packageName}.apk`;
        
        // If path doesn't start with __dirname, make it relative
        if (!apkPath.startsWith('/') && !apkPath.includes('generated-apps/')) {
            apkPath = path.join('generated-apps', apkPath);
        }
        
        const fullPath = path.join(__dirname, apkPath);
        console.log(`📁 Looking for APK at: ${fullPath}`);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️ APK not found at: ${fullPath}`);
            return res.status(404).json({
                success: false,
                message: 'APK file not found. Please regenerate the app.'
            });
        }

        // Increment downloads
        app.downloads = (app.downloads || 0) + 1;
        await app.save();

        // Send file for download
        const stat = fs.statSync(fullPath);
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${app.packageName}.apk"`);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'no-cache');
        
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download app: ' + error.message
        });
    }
});

// ============================================
// FAVORITE
// ============================================
router.post('/apps/:id/favorite', protect, async (req, res) => {
    try {
        const user = req.user;
        const appId = req.params.id;
        
        // Check if app exists
        const app = await App.findById(appId);
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }
        
        const index = user.favorites.indexOf(appId);
        if (index > -1) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(appId);
        }
        await user.save();
        
        res.status(200).json({
            success: true,
            message: index > -1 ? 'Removed from favorites' : 'Added to favorites',
            data: { favorites: user.favorites }
        });
    } catch (error) {
        console.error('Favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update favorites'
        });
    }
});

// ============================================
// REGENERATE APK
// ============================================
router.post('/apps/:id/regenerate', protect, async (req, res) => {
    try {
        const app = await App.findById(req.params.id);
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }
        
        // Check if user is the developer or admin
        if (app.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to regenerate this app'
            });
        }
        
        app.status = 'generating';
        await app.save();
        
        const result = await generateAppAPK(app._id, req.user._id);
        
        app.generated = true;
        app.generatedApkPath = result.apkPath || `generated-apps/${app.packageName}.apk`;
        app.generatedAt = new Date();
        app.apkUrl = result.apkUrl || `/generated/${app.packageName}.apk`;
        app.fileSize = result.fileSize || app.fileSize;
        app.status = 'approved';
        await app.save();
        
        res.status(200).json({
            success: true,
            message: 'APK regenerated successfully',
            data: {
                apkUrl: app.apkUrl,
                downloadUrl: `/api/apps/download/${app.packageName}`,
                fileSize: app.fileSize
            }
        });
    } catch (error) {
        console.error('Regenerate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to regenerate APK: ' + error.message
        });
    }
});

module.exports = router;
