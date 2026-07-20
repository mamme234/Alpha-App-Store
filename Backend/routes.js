const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, App, Review } = require('./models');

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
router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      data: { user: { id: user._id, username: user.username, email: user.email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
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

router.post('/apps', protect, async (req, res) => {
  try {
    const appData = { ...req.body, developer: req.user._id };
    const app = new App(appData);
    await app.save();
    res.status(201).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(200).json({ success: true, data: { favorites: user.favorites } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== REVIEW ROUTES =====
router.get('/reviews/:appId', async (req, res) => {
  try {
    const reviews = await Review.find({ app: req.params.appId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/reviews', protect, async (req, res) => {
  try {
    const { app, rating, title, content } = req.body;
    const review = new Review({ user: req.user._id, app, rating, title, content });
    await review.save();
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
