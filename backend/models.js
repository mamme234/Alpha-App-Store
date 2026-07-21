const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// USER MODEL
// ============================================
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
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
    bio: {
        type: String,
        maxlength: 500
    },
    website: {
        type: String
    },
    location: {
        type: String
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
        },
        version: String
    }],
    developerProfile: {
        company: String,
        website: String,
        bio: String,
        approved: {
            type: Boolean,
            default: false
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
    },
    lastLogin: {
        type: Date
    }
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

// ============================================
// CATEGORY MODEL
// ============================================
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    icon: {
        type: String,
        default: '📁'
    },
    description: {
        type: String,
        maxlength: 500
    },
    color: {
        type: String,
        default: '#4f46e5'
    },
    appCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// ============================================
// APP MODEL
// ============================================
const AppSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    packageName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true,
        maxlength: 160
    },
    icon: {
        type: String,
        default: null
    },
    screenshots: [{
        type: String
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    fileSize: {
        type: String,
        default: '5MB'
    },
    fileSizeBytes: {
        type: Number,
        default: 5242880
    },
    minAndroidVersion: {
        type: String,
        default: '5.0'
    },
    apkUrl: {
        type: String,
        default: ''
    },
    apkFilePath: {
        type: String,
        default: ''
    },
    developer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deployment: {
        vercel: { type: String, default: '' },
        render: { type: String, default: '' },
        netlify: { type: String, default: '' },
        github: { type: String, default: '' },
        custom: { type: String, default: '' }
    },
    generated: {
        type: Boolean,
        default: false
    },
    generatedApkPath: {
        type: String,
        default: ''
    },
    generatedAt: {
        type: Date,
        default: null
    },
    downloads: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    trending: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'generating', 'generated'],
        default: 'pending'
    },
    permissions: [{
        type: String
    }],
    features: [{
        type: String
    }],
    changelog: [{
        version: String,
        changes: [String],
        date: { type: Date, default: Date.now }
    }],
    requiresAndroid: {
        type: String,
        default: '5.0'
    },
    language: {
        type: String,
        default: 'English'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// ============================================
// REVIEW MODEL
// ============================================
const ReviewSchema = new mongoose.Schema({
    app: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpful: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// ============================================
// DOWNLOAD MODEL
// ============================================
const DownloadSchema = new mongoose.Schema({
    app: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    version: {
        type: String
    },
    success: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// ============================================
// FAVORITE MODEL
// ============================================
const FavoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    app: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: true
    }
}, { timestamps: true });

// ============================================
// NOTIFICATION MODEL
// ============================================
const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['app_approved', 'app_rejected', 'new_update', 'comment', 'review', 'system'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    app: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App'
    }
}, { timestamps: true });

// ============================================
// EXPORT MODELS
// ============================================
const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const App = mongoose.model('App', AppSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Download = mongoose.model('Download', DownloadSchema);
const Favorite = mongoose.model('Favorite', FavoriteSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = {
    User,
    Category,
    App,
    Review,
    Download,
    Favorite,
    Notification
};
