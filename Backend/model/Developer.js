const mongoose = require('mongoose');

const developerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required']
  },
  companyWebsite: {
    type: String,
    match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 'Please provide a valid URL']
  },
  companyEmail: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true
  },
  companyPhone: {
    type: String
  },
  companyAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  description: {
    type: String,
    maxlength: 1000
  },
  logo: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  totalDownloads: {
    type: Number,
    default: 0
  },
  totalApps: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  earnings: {
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 }
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  subscriptionExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  apps: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  }],
  analytics: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Pre-save middleware to update totalApps
developerSchema.pre('save', function(next) {
  if (this.apps) {
    this.totalApps = this.apps.length;
  }
  next();
});

module.exports = mongoose.model('Developer', developerSchema);
