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
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

// ===== AUTH ROUTES =====
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ success: false, message: 'User exists' });
    const user = new User({ username, email, password, role: role || 'user' });
    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      data: { user: { id: user._id, username, email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      data: { 
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
        token 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/auth/me', protect, async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

// ===== APP ROUTES =====
router.get('/apps', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    const query = category ? { category, status: 'approved' } : { status: 'approved' };
    const apps = await App.find(query).limit(parseInt(limit)).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/apps/featured', async (req, res) => {
  try {
    const apps = await App.find({ featured: true, status: 'approved' }).limit(10);
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/apps/trending', async (req, res) => {
  try {
    const apps = await App.find({ trending: true, status: 'approved' }).limit(10);
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/apps/:id', async (req, res) => {
  try {
    const app = await App.findOne({ packageName: req.params.id });
    if (!app) return res.status(404).json({ success: false, message: 'App not found' });
    res.status(200).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SUBMIT APP =====
router.post('/apps/submit', protect, async (req, res) => {
  try {
    const { 
      name, packageName, description, shortDescription, 
      icon, category, version, fileSize, 
      fileSizeBytes, minAndroidVersion,
      deployment, permissions, features 
    } = req.body;

    const existing = await App.findOne({ packageName });
    if (existing) {
      return res.status(400).json({ success: false, message: 'App already exists' });
    }

    // Generate APK URL
    const apkUrl = `/generated/${packageName}.apk`;

    const app = new App({
      name,
      packageName,
      description,
      shortDescription,
      icon: icon || 'https://via.placeholder.com/128',
      category,
      version: version || '1.0.0',
      fileSize: fileSize || '5MB',
      fileSizeBytes: fileSizeBytes || 5242880,
      minAndroidVersion: minAndroidVersion || '5.0',
      apkUrl: apkUrl,
      developer: req.user._id,
      deployment: {
        vercel: deployment?.vercel || '',
        render: deployment?.render || '',
        netlify: deployment?.netlify || '',
        github: deployment?.github || '',
        custom: deployment?.custom || ''
      },
      permissions: permissions || [],
      features: features || [],
      status: 'approved'
    });

    await app.save();

    // Generate APK
    try {
      await generateAppAPK(app._id);
    } catch (genError) {
      console.error('APK Generation Error:', genError);
    }

    res.status(201).json({
      success: true,
      message: 'App submitted successfully! APK is being generated.',
      data: app
    });
  } catch (error) {
    console.error('App submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit app', 
      error: error.message 
    });
  }
});

// ===== DOWNLOAD APK =====
router.get('/apps/download/:id', async (req, res) => {
  try {
    const app = await App.findOne({ packageName: req.params.id });
    if (!app) return res.status(404).json({ success: false, message: 'App not found' });

    const apkPath = path.join(__dirname, 'generated-apps', `${app.packageName}.apk`);
    if (!fs.existsSync(apkPath)) {
      // Generate if not exists
      await generateAppAPK(app._id);
    }

    app.downloads += 1;
    await app.save();

    res.download(apkPath, `${app.packageName}.apk`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== FAVORITE =====
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
    res.status(200).json({ success: true, data: { favorites: user.favorites } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
