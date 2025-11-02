const Savings = require('../models/Savings');
const { getStartOfMonth, getEndOfMonth } = require('../utils/dateUtils');

/**
 * Get or create savings account
 * @param {string} userId - User ID
 * @returns {Promise<object>} Savings account
 */
const getSavingsAccount = async (userId) => {
  let savings = await Savings.findOne({ userId });

  if (!savings) {
    savings = await Savings.create({
      userId,
      initialAmount: 0,
      currentAmount: 0
    });
  }

  return { success: true, savings };
};

/**
 * Deposit to savings
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deposit
 * @param {string} reason - Reason for deposit
 * @returns {Promise<object>} Updated savings
 */
const depositToSavings = async (userId, amount, reason = '') => {
  if (!amount || amount <= 0) {
    return { success: false, errors: ['Invalid amount'] };
  }

  let savings = await Savings.findOne({ userId });

  if (!savings) {
    savings = await Savings.create({
      userId,
      initialAmount: amount,
      currentAmount: amount,
      transactions: [{
        amount,
        type: 'deposit',
        reason,
        date: new Date()
      }]
    });
  } else {
    savings.currentAmount += amount;
    savings.transactions.push({
      amount,
      type: 'deposit',
      reason,
      date: new Date()
    });
    savings.updatedAt = new Date();
    await savings.save();
  }

  return { success: true, savings };
};

/**
 * Generate personalized advice for withdrawal
 * @param {number} amount - Withdrawal amount
 * @param {number} currentAmount - Current savings amount
 * @param {string} reason - Withdrawal reason
 * @returns {string} Personalized advice
 */
const generateWithdrawalAdvice = (amount, currentAmount, reason = '') => {
  const percentage = (amount / currentAmount) * 100;
  const reasonLower = reason.toLowerCase();

  let advice = '';

  // Check reason-based advice
  if (reasonLower.includes('emergency') || reasonLower.includes('urgent')) {
    advice = "💡 Emergency withdrawals are necessary, but try to rebuild this amount within the next 2-3 months. Consider setting up an emergency fund goal.";
  } else if (reasonLower.includes('shopping') || reasonLower.includes('purchase') || reasonLower.includes('buy')) {
    advice = "🛍️ Consider if this purchase is a need or a want. Using savings for non-essentials might delay your financial goals. Could you wait and save more first?";
  } else if (reasonLower.includes('medical') || reasonLower.includes('health')) {
    advice = "🏥 Health comes first! Consider investing in health insurance to protect your savings from future medical expenses.";
  } else if (reasonLower.includes('investment') || reasonLower.includes('business')) {
    advice = "📈 Great! Investing your savings can grow your wealth. Make sure to research well and diversify your investments.";
  } else if (reasonLower.includes('debt') || reasonLower.includes('loan') || reasonLower.includes('emi')) {
    advice = "💳 Paying off debt is smart! Focus on high-interest debts first. Once clear, redirect those payments to savings.";
  } else {
    // Percentage-based general advice
    if (percentage > 50) {
      advice = "⚠️ You're withdrawing over 50% of your savings! This significantly impacts your financial security. Consider if this is absolutely necessary.";
    } else if (percentage > 30) {
      advice = "⚡ That's a substantial withdrawal. Make a plan to replenish this amount soon to maintain your financial cushion.";
    } else if (percentage > 10) {
      advice = "💰 Remember to rebuild your savings. Try to replace this amount within the next month if possible.";
    } else {
      advice = "👍 Good job keeping the withdrawal small! Your savings remain strong. Keep up the disciplined approach.";
    }
  }

  return advice;
};

/**
 * Withdraw from savings
 * @param {string} userId - User ID
 * @param {number} amount - Amount to withdraw
 * @param {string} reason - Reason for withdrawal
 * @returns {Promise<object>} Updated savings with personalized advice
 */
const withdrawFromSavings = async (userId, amount, reason = '') => {
  if (!amount || amount <= 0) {
    return { success: false, errors: ['Invalid amount'] };
  }

  const savings = await Savings.findOne({ userId });

  if (!savings) {
    return { success: false, errors: ['Savings account not found'] };
  }

  if (savings.currentAmount < amount) {
    return { success: false, errors: ['Insufficient funds'] };
  }

  // Generate personalized advice
  const advice = generateWithdrawalAdvice(amount, savings.currentAmount, reason);

  savings.currentAmount -= amount;
  savings.transactions.push({
    amount,
    type: 'withdrawal',
    reason,
    date: new Date()
  });
  savings.updatedAt = new Date();
  await savings.save();

  return { success: true, savings, advice };
};

/**
 * Review monthly savings
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date
 * @returns {Promise<object>} Monthly review
 */
const reviewMonthlySavings = async (userId, currentDate) => {
  const savings = await Savings.findOne({ userId });

  if (!savings) {
    return { success: false, errors: ['Savings account not found'] };
  }

  const startOfMonth = getStartOfMonth(currentDate);
  const endOfMonth = getEndOfMonth(currentDate);

  // Find withdrawals this month
  const monthlyWithdrawals = savings.transactions.filter(t =>
    t.type === 'withdrawal' &&
    t.date >= startOfMonth &&
    t.date <= endOfMonth
  );

  const noDecrease = monthlyWithdrawals.length === 0;

  const review = {
    noDecrease,
    message: noDecrease
      ? 'Congratulations! You did not decrease your savings this month. Keep up the great work!'
      : `You made ${monthlyWithdrawals.length} withdrawal(s) this month.`,
    totalWithdrawn: monthlyWithdrawals.reduce((sum, t) => sum + t.amount, 0),
    withdrawalCount: monthlyWithdrawals.length
  };

  // Update last month review
  savings.lastMonthReview = {
    date: currentDate,
    noDecrease,
    reviewed: true
  };
  await savings.save();

  return { success: true, review, savings };
};

/**
 * Get savings summary
 * @param {string} userId - User ID
 * @returns {Promise<object>} Savings summary
 */
const getSavingsSummary = async (userId) => {
  const savings = await Savings.findOne({ userId });

  if (!savings) {
    return { success: false, errors: ['Savings account not found'] };
  }

  const totalDeposits = savings.transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = savings.transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const summary = {
    currentAmount: savings.currentAmount,
    initialAmount: savings.initialAmount,
    totalDeposits,
    totalWithdrawals,
    transactionCount: savings.transactions.length,
    lastMonthReview: savings.lastMonthReview
  };

  return { success: true, summary, savings };
};

/**
 * Restore all budget-related withdrawals (admin/recovery function)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result
 */
const restoreAllBudgetWithdrawals = async (userId) => {
  const savings = await Savings.findOne({ userId });

  if (!savings) {
    return { success: false, errors: ['Savings account not found'] };
  }

  // Find all budget-related withdrawals that haven't been restored
  const budgetWithdrawals = savings.transactions.filter(t => {
    const reasonLower = (t.reason || '').toLowerCase();
    const isBudgetRelated = reasonLower.includes('budget') ||
                            reasonLower.includes('exceeded') ||
                            reasonLower.includes('exceed') ||
                            reasonLower.includes('category') ||
                            reasonLower.includes('expenses');
    const isNotRestoration = !reasonLower.includes('restored') && !reasonLower.includes('restore');
    return t.type === 'withdrawal' && isBudgetRelated && isNotRestoration;
  });

  console.log(`Found ${budgetWithdrawals.length} budget-related withdrawals to restore`);

  let totalRestored = 0;
  for (const withdrawal of budgetWithdrawals) {
    totalRestored += withdrawal.amount;
    savings.transactions.push({
      amount: withdrawal.amount,
      type: 'deposit',
      reason: `Restored budget-related withdrawal from ${new Date(withdrawal.date).toLocaleDateString()}`,
      date: new Date()
    });
  }

  if (totalRestored > 0) {
    savings.currentAmount += totalRestored;
    savings.updatedAt = new Date();
    await savings.save();
  }

  return {
    success: true,
    message: `Restored ${budgetWithdrawals.length} withdrawal(s) totaling ${totalRestored}`,
    restoredAmount: totalRestored,
    restoredCount: budgetWithdrawals.length,
    savings
  };
};

module.exports = {
  getSavingsAccount,
  depositToSavings,
  withdrawFromSavings,
  reviewMonthlySavings,
  getSavingsSummary,
  restoreAllBudgetWithdrawals
};
