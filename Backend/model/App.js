const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'App name is required'],
    trim: true,
    index: true
  },
  packageName: {
    type: String,
    required: [true, 'Package name is required'],
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [50, 'Description must be at least 50 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [160, 'Short description cannot exceed 160 characters']
  },
  icon: {
    type: String,
    required: [true, 'App icon is required']
  },
  screenshots: [{
    type: String
  }],
  videoTrailer: {
    type: String,
    match: [/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/, 'Please provide a valid video URL']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['games', 'education', 'finance', 'social', 'tools', 'productivity', 'health', 'music', 'entertainment', 'news', 'shopping', 'travel', 'sports', 'photography', 'books', 'business', 'lifestyle', 'communication']
  },
  version: {
    type: String,
    required: [true, 'Version is required'],
    match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (e.g., 1.0.0)']
  },
  fileSize: {
    type: String,
    required: [true, 'File size is required']
  },
  fileSizeBytes: {
    type: Number,
    required: true
  },
  minAndroidVersion: {
    type: String,
    required: [true, 'Minimum Android version is required'],
    enum: ['5.0', '6.0', '7.0', '8.0', '9.0', '10.0', '11.0', '12.0', '13.0', '14.0']
  },
  targetAndroidVersion: {
    type: String,
    required: [true, 'Target Android version is required'],
    enum: ['5.0', '6.0', '7.0', '8.0', '9.0', '10.0', '11.0', '12.0', '13.0', '14.0']
  },
  apkUrl: {
    type: String,
    required: [true, 'APK file URL is required']
  },
  sha256Checksum: {
    type: String,
    required: [true, 'SHA-256 checksum is required'],
    match: [/^[a-fA-F0-9]{64}$/, 'Invalid SHA-256 checksum format']
  },
  virusScanStatus: {
    type: String,
    enum: ['pending', 'clean', 'infected', 'error'],
    default: 'pending'
  },
  virusScanReport: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Developer',
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
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
    enum: ['pending', 'approved', 'rejected', 'banned'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  permissions: [{
    type: String
  }],
  features: [{
    type: String
  }],
  languages: [{
    type: String,
    enum: ['en', 'am', 'om', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
  }],
  installGuide: {
    type: String,
    default: '1. Download the APK file\n2. Enable "Install from unknown sources" in settings\n3. Open the APK file and tap "Install"\n4. Wait for installation to complete\n5. Tap "Open" to launch the app'
  },
  versionHistory: [{
    version: {
      type: String,
      required: true
    },
    releaseNotes: {
      type: String,
      required: true
    },
    fileSize: String,
    fileSizeBytes: Number,
    apkUrl: String,
    sha256Checksum: String,
    releasedAt: {
      type: Date,
      default: Date.now
    },
    isCurrent: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String
  }],
  requiredPermissions: [{
    name: String,
    description: String,
    required: Boolean
  }],
  screenshotsGallery: [{
    url: String,
    caption: String
  }],
  similarApps: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  }],
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for search
appSchema.index({ 
  name: 'text', 
  description: 'text', 
  shortDescription: 'text',
  packageName: 'text',
  tags: 'text'
});

// Virtual for rating distribution
appSchema.virtual('ratingDistribution').get(function() {
  // This would be calculated from reviews
  return {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0
  };
});

// Method to increment downloads
appSchema.methods.incrementDownloads = async function() {
  this.downloads += 1;
  await this.save();
};

// Method to update rating
appSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { app: this._id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    this.rating = Math.round(result[0].avgRating * 10) / 10;
    this.reviewCount = result[0].count;
    await this.save();
  }
};

module.exports = mongoose.model('App', appSchema);
