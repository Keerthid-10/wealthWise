const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  contributionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'late', 'missed'],
    default: 'pending'
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  }
});

const payoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payoutDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'processing'],
    default: 'pending'
  },
  monthCycle: {
    type: Number,
    required: true
  }
});

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  hasReceivedPayout: {
    type: Boolean,
    default: false
  },
  payoutPosition: {
    type: Number,
    required: true
  },
  totalContributions: {
    type: Number,
    default: 0
  },
  missedPayments: {
    type: Number,
    default: 0
  },
  totalPenalties: {
    type: Number,
    default: 0
  }
});

const communitySavingsPotSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  monthlyContribution: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'AED'],
    default: 'INR'
  },
  startDate: {
    type: Date,
    required: true
  },
  currentCycle: {
    type: Number,
    default: 1
  },
  totalCycles: {
    type: Number,
    required: true
  },
  payoutMethod: {
    type: String,
    enum: ['rotation', 'voting'],
    default: 'rotation'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  contributions: [contributionSchema],
  payouts: [payoutSchema],
  latePenaltyPercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  gracePeriodDays: {
    type: Number,
    default: 3,
    min: 0
  },
  reminderDaysBefore: {
    type: Number,
    default: 3,
    min: 0
  },
  nextPayoutDate: {
    type: Date
  },
  nextContributionDueDate: {
    type: Date
  },
  totalPotAmount: {
    type: Number,
    default: 0
  },
  rules: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
communitySavingsPotSchema.index({ createdBy: 1, status: 1 });
communitySavingsPotSchema.index({ 'members.userId': 1 });
communitySavingsPotSchema.index({ status: 1, currentCycle: 1 });

// Virtual for checking if group is full
communitySavingsPotSchema.virtual('isFull').get(function() {
  return this.members.length >= this.totalCycles;
});

// Method to calculate next payout recipient
communitySavingsPotSchema.methods.getNextPayoutRecipient = function() {
  if (this.payoutMethod === 'rotation') {
    const sortedMembers = this.members.sort((a, b) => a.payoutPosition - b.payoutPosition);
    return sortedMembers.find(member => !member.hasReceivedPayout);
  }
  return null;
};

// Method to calculate total pot for current cycle
communitySavingsPotSchema.methods.calculateCurrentPot = function() {
  const currentCycleContributions = this.contributions.filter(
    c => c.status === 'completed' &&
    c.contributionDate >= this.startDate &&
    c.contributionDate <= new Date()
  );

  const totalContributions = currentCycleContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalPenalties = currentCycleContributions.reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);

  return totalContributions + totalPenalties;
};

// Method to check if member has pending contributions
communitySavingsPotSchema.methods.hasPendingContribution = function(userId) {
  return this.contributions.some(
    c => c.userId.toString() === userId.toString() &&
    c.status === 'pending' &&
    c.dueDate >= new Date()
  );
};

// Method to calculate penalty for late payment
communitySavingsPotSchema.methods.calculatePenalty = function(daysLate) {
  if (daysLate <= this.gracePeriodDays) {
    return 0;
  }
  return (this.monthlyContribution * this.latePenaltyPercentage) / 100;
};

const CommunitySavingsPot = mongoose.model('CommunitySavingsPot', communitySavingsPotSchema);

module.exports = CommunitySavingsPot;
