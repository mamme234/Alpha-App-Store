const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ===== USER MODEL =====
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'developer', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App'
    }],
    downloads: [{
        app: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'App'
        },
        downloadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = async function(candidate) {
    return await bcrypt.compare(candidate, this.password);
};

// ===== APP MODEL =====
const AppSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    packageName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 160 },
    icon: { type: String, default: 'https://via.placeholder.com/128' },
    screenshots: [String],
    category: {
        type: String,
        required: true,
        enum: ['games', 'education', 'finance', 'social', 'tools', 'productivity', 'health', 'music', 'entertainment', 'news']
    },
    version: { type: String, default: '1.0.0' },
    fileSize: { type: String, default: '5MB' },
    fileSizeBytes: { type: Number, default: 5242880 },
    minAndroidVersion: { type: String, default: '5.0' },
    apkUrl: { type: String, default: '' },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deployment: {
        vercel: { type: String, default: '' },
        render: { type: String, default: '' },
        netlify: { type: String, default: '' },
        github: { type: String, default: '' },
        custom: { type: String, default: '' }
    },
    generated: { type: Boolean, default: false },
    generatedApkPath: { type: String, default: '' },
    generatedAt: { type: Date, default: null },
    downloads: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'generating', 'generated'],
        default: 'pending'
    },
    permissions: [String],
    features: [String]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const App = mongoose.model('App', AppSchema);

module.exports = { User, App };
