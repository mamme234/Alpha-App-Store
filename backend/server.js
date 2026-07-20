require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== CREATE DIRECTORIES =====
['uploads', 'uploads/apks', 'uploads/icons', 'generated-apps'].forEach(dir => {
    fs.ensureDirSync(path.join(__dirname, dir));
});

// ===== CORS (FIXED) =====
app.use(cors({
    origin: [
        'https://alpha-app-store.vercel.app',
        'https://your-vercel-app.vercel.app', // Replace with your actual Vercel URL
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== MIDDLEWARE =====
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ===== STATIC FILES =====
app.use('/generated', express.static(path.join(__dirname, 'generated-apps')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== DATABASE =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha-store')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// ===== ROUTES =====
const routes = require('./routes');
app.use('/api', routes);

// ===== ROOT ROUTE (FIXED 404) =====
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'Alpha App Store API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            health: '/health',
            api: '/api',
            apps: '/api/apps',
            auth: '/api/auth'
        }
    });
});

// ===== HEALTH CHECK (IMPROVED) =====
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
            'GET /',
            'GET /health',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'GET /api/apps',
            'GET /api/apps/featured',
            'GET /api/apps/trending',
            'GET /api/apps/:id',
            'POST /api/apps/submit',
            'GET /api/apps/download/:id',
            'POST /api/apps/:id/favorite'
        ]
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Generated APKs: ${path.join(__dirname, 'generated-apps')}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
