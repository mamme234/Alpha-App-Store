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
                    role: user.role
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
                    role: user.role
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
router.get('/apps', async (req, res) => {
    try {
        const { category, limit = 20 } = req.query;
        const query = category ? { category, status: 'approved' } : { status: 'approved' };
        const apps = await App.find(query)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        console.error('Get apps error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch apps'
        });
    }
});

router.get('/apps/featured', async (req, res) => {
    try {
        const apps = await App.find({ featured: true, status: 'approved' }).limit(10);
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

router.get('/apps/trending', async (req, res) => {
    try {
        const apps = await App.find({ trending: true, status: 'approved' }).limit(10);
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

router.get('/apps/:id', async (req, res) => {
    try {
        const app = await App.findOne({ packageName: req.params.id });
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
            message: 'Failed to fetch app'
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

        // Validate
        if (!name || !packageName || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, package name and category are required'
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

        // Create app
        const app = new App({
            name,
            packageName,
            description: description || 'No description available',
            shortDescription: shortDescription || name,
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
            features: features || ['Fast loading', 'User friendly', 'Secure'],
            permissions: permissions || ['Internet', 'Storage'],
            status: 'generating'
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
            
            res.status(201).json({
                success: true,
                message: 'App submitted and APK generated successfully!',
                data: {
                    app: app,
                    apkUrl: result.apkUrl,
                    downloadUrl: result.downloadUrl,
                    apkPath: result.apkPath,
                    fileSize: result.fileSize
                }
            });
        } catch (genError) {
            console.error('❌ APK generation failed:', genError);
            app.status = 'pending';
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
router.get('/apps/download/:id', async (req, res) => {
    try {
        const app = await App.findOne({ packageName: req.params.id });
        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }

        // Check if APK exists
        const apkPath = path.join(__dirname, app.generatedApkPath || `generated-apps/${app.packageName}.apk`);
        
        if (!fs.existsSync(apkPath)) {
            return res.status(404).json({
                success: false,
                message: 'APK file not found. Please regenerate the app.'
            });
        }

        // Increment downloads
        app.downloads += 1;
        await app.save();

        // Send file for download
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${app.packageName}.apk"`);
        res.setHeader('Content-Length', fs.statSync(apkPath).size);
        
        const fileStream = fs.createReadStream(apkPath);
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
        const index = user.favorites.indexOf(appId);
        if (index > -1) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(appId);
        }
        await user.save();
        res.status(200).json({
            success: true,
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

module.exports = router;
