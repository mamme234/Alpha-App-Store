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

// Create directories
['uploads', 'uploads/apks', 'uploads/icons', 'generated-apps'].forEach(dir => {
    fs.ensureDirSync(path.join(__dirname, dir));
});

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/generated', express.static(path.join(__dirname, 'generated-apps')));

// Database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha-store')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Generated APKs: ${path.join(__dirname, 'generated-apps')}`);
});
