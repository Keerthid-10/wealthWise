const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  category: {
    type: String,
    enum: ['Emergency Fund', 'Vacation', 'Car', 'House', 'Education', 'Retirement', 'Wedding', 'Others'],
    default: 'Others'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

financialGoalSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
