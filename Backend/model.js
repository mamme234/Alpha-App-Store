const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ===== USER MODEL =====
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'developer', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'App' }],
  downloads: [{
    app: { type: mongoose.Schema.Types.ObjectId, ref: 'App' },
    downloadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
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
  icon: { type: String, required: true },
  screenshots: [String],
  category: { 
    type: String, 
    required: true, 
    enum: ['games','education','finance','social','tools','productivity','health','music'] 
  },
  version: { type: String, required: true },
  fileSize: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  minAndroidVersion: { type: String, required: true },
  apkUrl: { type: String, required: true },
  developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  permissions: [String],
  features: [String]
}, { timestamps: true });

// ===== REVIEW MODEL =====
const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  app: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  content: { type: String, required: true },
  helpfulCount: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const App = mongoose.model('App', AppSchema);
const Review = mongoose.model('Review', ReviewSchema);

module.exports = { User, App, Review };
