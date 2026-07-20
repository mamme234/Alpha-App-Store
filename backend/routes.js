const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import models
const { User, App } = require('./models');

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

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

// ============================================
// REGISTER - FIXED WITH DEBUGGING
// ============================================
router.post('/auth/register', async (req, res) => {
    try {
        console.log('📝 Registration request received');
        console.log('📤 Request body:', { 
            ...req.body, 
            password: req.body.password ? '***' : 'undefined' 
        });

        const { username, email, password, role } = req.body;

        // Validation
        if (!username || !email || !password) {
            console.log('❌ Missing fields');
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email and password'
            });
        }

        // Check if user exists
        const existing = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existing) {
            console.log('❌ User already exists:', existing.email);
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
        console.log('✅ User created:', user._id);

        // Generate token
        const token = generateToken(user._id);
        console.log('✅ Token generated for user:', username);

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
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
});

// ============================================
// LOGIN
// ============================================
router.post('/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login request received');
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Password mismatch for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);
        console.log('✅ Login successful for:', email);

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
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
});

// ============================================
// GET ME
// ============================================
router.get('/auth/me', protect, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        console.error('❌ Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
});

// ============================================
// APPS ROUTES
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
        console.error('❌ Get apps error:', error);
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
        console.error('❌ Get featured error:', error);
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
        console.error('❌ Get trending error:', error);
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
        console.error('❌ Get app error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch app'
        });
    }
});

router.post('/apps/submit', protect, async (req, res) => {
    try {
        const appData = {
            ...req.body,
            developer: req.user._id,
            status: 'approved'
        };
        
        const app = new App(appData);
        await app.save();
        
        res.status(201).json({
            success: true,
            message: 'App submitted successfully',
            data: app
        });
    } catch (error) {
        console.error('❌ Submit app error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit app: ' + error.message
        });
    }
});

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
        console.error('❌ Favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update favorites'
        });
    }
});

module.exports = router;
