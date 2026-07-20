const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    maxlength: 100
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    maxlength: 2000
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  reply: {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Developer'
    },
    content: String,
    repliedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per app
reviewSchema.index({ user: 1, app: 1 }, { unique: true });

// Post-save middleware to update app rating
reviewSchema.post('save', async function() {
  const App = mongoose.model('App');
  const app = await App.findById(this.app);
  if (app) {
    await app.updateRating();
  }
});

// Post-remove middleware to update app rating
reviewSchema.post('remove', async function() {
  const App = mongoose.model('App');
  const app = await App.findById(this.app);
  if (app) {
    await app.updateRating();
  }
});

module.exports = mongoose.model('Review', reviewSchema);
