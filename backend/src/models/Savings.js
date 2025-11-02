const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initialAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currentAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  monthlyTarget: {
    type: Number,
    default: 0
  },
  transactions: [{
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastMonthReview: {
    date: Date,
    noDecrease: Boolean,
    reviewed: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

savingsSchema.index({ userId: 1 });

module.exports = mongoose.model('Savings', savingsSchema);
