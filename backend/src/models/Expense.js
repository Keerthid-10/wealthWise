const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Rent', 'EMI', 'Others']
  },
  merchant: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Others'],
    default: 'Cash'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecurringExpense'
  },
  bankTransactionId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
