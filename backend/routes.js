const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { generateAppAPK } = require('./generator');

const {
    User,
    App,
    Category,
    Review,
    Download,
    Favorite,
    Notification
} = require('./models');

// ============================================
// AUTH MIDDLEWARE
// ============================================
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

const isAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

const isDeveloper = async (req, res, next) => {
    if (req.user.role !== 'developer' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Developer access required' });
    }
    next();
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

// ============================================
// FILE UPLOAD CONFIG
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = 'uploads/';
        if (file.fieldname === 'icon') dir += 'icons/';
        else if (file.fieldname === 'screenshot') dir += 'screenshots/';
        else if (file.fieldname === 'apk') dir += 'apks/';
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/vnd.android.package-archive'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// ============================================
// AUTH ROUTES
// ============================================

// REGISTER - /auth/register
router.post('/auth/register', async (req, res) => {
    try {
        console.log('📝 Registration request received:', req.body.email);
        
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username, email and password' 
            });
        }

        // Check if user exists
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email or username' 
            });
        }

        // Create user
        const user = new User({
            username,
            email,
            password,
            role: role || 'user'
        });

        await user.save();
        console.log('✅ User created:', user.username);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
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
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed: ' + error.message 
        });
    }
});

// LOGIN - /auth/login
router.post('/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login request received:', req.body.email);
        
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        console.log('✅ Login successful:', user.username);

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
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed: ' + error.message 
        });
    }
});

// GET CURRENT USER - /auth/me
router.get('/auth/me', protect, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user data' 
        });
    }
});

// ============================================
// CATEGORY ROUTES
// ============================================
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ appCount: -1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/categories', protect, isAdmin, async (req, res) => {
    try {
        const { name, icon, description, color } = req.body;
        const slug = name.toLowerCase().replace(/ /g, '-');
        const category = new Category({ name, slug, icon, description, color });
        await category.save();
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// APP ROUTES
// ============================================
router.get('/apps', async (req, res) => {
    try {
        const { category, search, limit = 20, page = 1, sort = 'createdAt' } = req.query;
        const skip = (page - 1) * limit;

        let query = { status: 'approved', isPublished: true };

        if (category) {
            const categoryDoc = await Category.findOne({ slug: category });
            if (categoryDoc) query.category = categoryDoc._id;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const apps = await App.find(query)
            .populate('category', 'name slug')
            .populate('developer', 'username avatar')
            .sort({ [sort]: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await App.countDocuments(query);

        res.status(200).json({
            success: true,
            data: apps,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/apps/featured', async (req, res) => {
    try {
        const apps = await App.find({ featured: true, status: 'approved', isPublished: true })
            .populate('category', 'name slug')
            .populate('developer', 'username avatar')
            .limit(10);
        res.status(200).json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/apps/trending', async (req, res) => {
    try {
        const apps = await App.find({ trending: true, status: 'approved', isPublished: true })
            .populate('category', 'name slug')
            .populate('developer', 'username avatar')
            .limit(10);
        res.status(200).json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/apps/latest', async (req, res) => {
    try {
        const apps = await App.find({ status: 'approved', isPublished: true })
            .populate('category', 'name slug')
            .populate('developer', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(10);
        res.status(200).json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/apps/top-downloads', async (req, res) => {
    try {
        const apps = await App.find({ status: 'approved', isPublished: true })
            .populate('category', 'name slug')
            .populate('developer', 'username avatar')
            .sort({ downloads: -1 })
            .limit(10);
        res.status(200).json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/apps/:id', async (req, res) => {
    try {
        let app = await App.findOne({ 
            $or: [
                { slug: req.params.id },
                { _id: req.params.id },
                { packageName: req.params.id }
            ]
        })
        .populate('category', 'name slug')
        .populate('developer', 'username avatar bio');

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        // Increment views
        app.views = (app.views || 0) + 1;
        await app.save();

        // Get related apps
        const related = await App.find({
            category: app.category._id,
            _id: { $ne: app._id },
            status: 'approved',
            isPublished: true
        })
        .populate('category', 'name slug')
        .populate('developer', 'username avatar')
        .limit(5);

        // Get reviews
        const reviews = await Review.find({ app: app._id })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                ...app.toObject(),
                related,
                reviews
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// APP SUBMIT (Developer)
// ============================================
router.post('/apps/submit', protect, isDeveloper, upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'screenshots', maxCount: 5 },
    { name: 'apk', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            name,
            packageName,
            description,
            shortDescription,
            category,
            version,
            minAndroidVersion,
            features,
            permissions,
            changelog,
            deployment
        } = req.body;

        // Validate
        if (!name || !packageName || !category) {
            return res.status(400).json({ success: false, message: 'Name, package name and category required' });
        }

        // Check if app exists
        const existing = await App.findOne({ packageName });
        if (existing) {
            return res.status(400).json({ success: false, message: 'App already exists' });
        }

        // Get category
        const categoryDoc = await Category.findOne({ slug: category });
        if (!categoryDoc) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        // Process files
        let iconUrl = null;
        let screenshotUrls = [];
        let apkPath = null;

        if (req.files) {
            if (req.files.icon) {
                iconUrl = `/uploads/icons/${req.files.icon[0].filename}`;
            }
            if (req.files.screenshots) {
                screenshotUrls = req.files.screenshots.map(f => `/uploads/screenshots/${f.filename}`);
            }
            if (req.files.apk) {
                apkPath = `/uploads/apks/${req.files.apk[0].filename}`;
            }
        }

        // Create app
        const app = new App({
            name,
            slug: name.toLowerCase().replace(/ /g, '-') + '-' + Date.now().toString(36),
            packageName,
            description: description || 'No description available',
            shortDescription: shortDescription || name.substring(0, 160),
            category: categoryDoc._id,
            developer: req.user._id,
            version: version || '1.0.0',
            minAndroidVersion: minAndroidVersion || '5.0',
            icon: iconUrl,
            screenshots: screenshotUrls,
            apkFilePath: apkPath,
            features: features ? features.split(',').map(f => f.trim()) : [],
            permissions: permissions ? permissions.split(',').map(p => p.trim()) : [],
            changelog: changelog ? [{ version: version || '1.0.0', changes: changelog.split(',').map(c => c.trim()) }] : [],
            deployment: deployment ? {
                vercel: deployment.vercel || '',
                render: deployment.render || '',
                netlify: deployment.netlify || '',
                github: deployment.github || '',
                custom: deployment.custom || ''
            } : {},
            status: 'pending'
        });

        await app.save();

        // Auto-generate APK if deployment URL provided
        let generationResult = null;
        const hasDeployment = app.deployment && Object.values(app.deployment).some(v => v && v.length > 0);
        
        if (hasDeployment) {
            try {
                generationResult = await generateAppAPK(app._id, req.user._id);
                app.generated = true;
                app.generatedApkPath = generationResult.apkPath;
                app.generatedAt = new Date();
                app.apkUrl = generationResult.apkUrl;
                app.fileSize = generationResult.fileSize;
                app.status = 'approved';
                app.isPublished = true;
                app.publishedAt = new Date();
                await app.save();
            } catch (genError) {
                console.error('APK generation failed:', genError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'App submitted successfully',
            data: {
                app,
                generation: generationResult
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DOWNLOAD APK
// ============================================
router.get('/apps/download/:id', async (req, res) => {
    try {
        let app = await App.findOne({
            $or: [
                { packageName: req.params.id },
                { _id: req.params.id },
                { slug: req.params.id }
            ]
        });

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        // Check if APK exists
        let apkPath = app.generatedApkPath || app.apkFilePath || `generated-apps/${app.packageName}.apk`;
        if (!apkPath.startsWith('/') && !apkPath.includes('generated-apps/')) {
            apkPath = path.join('generated-apps', apkPath);
        }

        const fullPath = path.join(__dirname, apkPath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'APK file not found. Please try again later.'
            });
        }

        // Increment downloads
        app.downloads = (app.downloads || 0) + 1;
        await app.save();

        // Track download
        const download = new Download({
            app: app._id,
            user: req.user?._id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            version: app.version
        });
        await download.save();

        // Send file
        const stat = fs.statSync(fullPath);
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${app.packageName}-${app.version}.apk"`);
        res.setHeader('Content-Length', stat.size);

        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// REVIEW ROUTES
// ============================================
router.post('/reviews', protect, async (req, res) => {
    try {
        const { appId, rating, title, comment } = req.body;

        if (!appId || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'App, rating and comment required' });
        }

        // Check if user already reviewed
        const existing = await Review.findOne({ app: appId, user: req.user._id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already reviewed this app' });
        }

        const review = new Review({
            app: appId,
            user: req.user._id,
            rating,
            title,
            comment
        });

        await review.save();

        // Update app rating
        const reviews = await Review.find({ app: appId });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await App.findByIdAndUpdate(appId, {
            rating: avgRating,
            reviewCount: reviews.length
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted',
            data: review
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/reviews/:appId', async (req, res) => {
    try {
        const reviews = await Review.find({ app: req.params.appId })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// FAVORITE ROUTES
// ============================================
router.post('/favorites/:appId', protect, async (req, res) => {
    try {
        const appId = req.params.appId;

        const existing = await Favorite.findOne({ user: req.user._id, app: appId });
        if (existing) {
            await existing.deleteOne();
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { favorites: appId }
            });
            return res.status(200).json({
                success: true,
                message: 'Removed from favorites',
                isFavorite: false
            });
        }

        await Favorite.create({ user: req.user._id, app: appId });
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { favorites: appId }
        });

        res.status(200).json({
            success: true,
            message: 'Added to favorites',
            isFavorite: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/favorites', protect, async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id })
            .populate({
                path: 'app',
                populate: [
                    { path: 'category', select: 'name slug' },
                    { path: 'developer', select: 'username avatar' }
                ]
            });

        res.status(200).json({
            success: true,
            data: favorites.map(f => f.app).filter(Boolean)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/admin/apps', protect, isAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = status ? { status } : {};
        const apps = await App.find(query)
            .populate('category', 'name')
            .populate('developer', 'username email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await App.countDocuments(query);

        res.status(200).json({
            success: true,
            data: apps,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.patch('/admin/apps/:id', protect, isAdmin, async (req, res) => {
    try {
        const { status, featured, trending } = req.body;
        const app = await App.findById(req.params.id);

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        if (status) {
            app.status = status;
            if (status === 'approved') {
                app.isPublished = true;
                app.publishedAt = new Date();
            }
        }
        if (featured !== undefined) app.featured = featured;
        if (trending !== undefined) app.trending = trending;

        await app.save();

        if (status) {
            const notification = new Notification({
                user: app.developer,
                type: status === 'approved' ? 'app_approved' : 'app_rejected',
                message: `Your app "${app.name}" has been ${status}`,
                link: `/apps/${app.slug}`,
                app: app._id
            });
            await notification.save();
        }

        res.status(200).json({
            success: true,
            message: 'App updated',
            data: app
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/stats', protect, isAdmin, async (req, res) => {
    try {
        const [totalApps, totalUsers, totalDownloads, pendingApps] = await Promise.all([
            App.countDocuments({ status: 'approved' }),
            User.countDocuments({ role: 'user' }),
            Download.countDocuments(),
            App.countDocuments({ status: 'pending' })
        ]);

        const topApps = await App.find({ status: 'approved' })
            .sort({ downloads: -1 })
            .limit(5)
            .select('name downloads icon');

        const recentDownloads = await Download.find()
            .populate('app', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                totalApps,
                totalUsers,
                totalDownloads,
                pendingApps,
                topApps,
                recentDownloads
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DEVELOPER ROUTES
// ============================================
router.get('/developer/apps', protect, isDeveloper, async (req, res) => {
    try {
        const apps = await App.find({ developer: req.user._id })
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.patch('/developer/apps/:id', protect, isDeveloper, async (req, res) => {
    try {
        const app = await App.findOne({
            _id: req.params.id,
            developer: req.user._id
        });

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        const { description, shortDescription, version, features, changelog } = req.body;

        if (description) app.description = description;
        if (shortDescription) app.shortDescription = shortDescription;
        if (version) app.version = version;
        if (features) app.features = features.split(',').map(f => f.trim());
        if (changelog) {
            app.changelog.push({
                version: version || app.version,
                changes: changelog.split(',').map(c => c.trim())
            });
        }

        if (version && version !== app.version) {
            try {
                const result = await generateAppAPK(app._id, req.user._id);
                app.generated = true;
                app.generatedApkPath = result.apkPath;
                app.generatedAt = new Date();
                app.apkUrl = result.apkUrl;
                app.fileSize = result.fileSize;
            } catch (genError) {
                console.error('APK regeneration failed:', genError);
            }
        }

        await app.save();

        res.status(200).json({
            success: true,
            message: 'App updated',
            data: app
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// SEARCH
// ============================================
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ success: false, message: 'Search term required' });
        }

        const apps = await App.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { shortDescription: { $regex: q, $options: 'i' } }
            ],
            status: 'approved',
            isPublished: true
        })
        .populate('category', 'name slug')
        .populate('developer', 'username avatar')
        .limit(20);

        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// EXPORT
// ============================================
module.exports = router;
