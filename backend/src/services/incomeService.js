const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { validateIncome } = require('../utils/validation');
const { convertCurrency } = require('../utils/currencyConverter');
const { getStartOfMonth, getEndOfMonth, getDaysRemainingInMonth } = require('../utils/dateUtils');

/**
 * Create new income entry
 * @param {string} userId - User ID
 * @param {object} incomeData - Income data
 * @returns {Promise<object>} Created income
 */
const createIncome = async (userId, incomeData) => {
  const validation = validateIncome(incomeData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const income = await Income.create({
    userId,
    ...incomeData
  });

  // Auto-deposit 10% to savings
  try {
    const savingsService = require('./savingsService');
    const autoDepositAmount = income.amount * 0.10;

    await savingsService.depositToSavings(
      userId,
      autoDepositAmount,
      `Auto-deposit 10% from income: ${income.source}`
    );

    console.log(`Auto-deposited ${autoDepositAmount} to savings from income ${income._id}`);
  } catch (error) {
    console.error('Error auto-depositing to savings:', error);
    // Continue even if auto-deposit fails
  }

  return {
    success: true,
    income,
    autoDeposit: {
      amount: income.amount * 0.10,
      message: `10% (${income.currency} ${(income.amount * 0.10).toFixed(2)}) automatically deposited to your savings!`
    }
  };
};

/**
 * Get user income
 * @param {string} userId - User ID
 * @param {object} filters - Filters
 * @returns {Promise<object>} Income list
 */
const getIncome = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  const income = await Income.find(query).sort({ date: -1 });

  return { success: true, income };
};

/**
 * Get income insights
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date (from client)
 * @param {string} currency - User currency
 * @returns {Promise<object>} Income insights
 */
const getIncomeInsights = async (userId, currentDate, currency = 'INR') => {
  const startOfMonth = getStartOfMonth(currentDate);
  const endOfMonth = getEndOfMonth(currentDate);

  // Get month's income
  const monthIncome = await Income.find({
    userId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  // Get month's expenses
  const monthExpenses = await Expense.find({
    userId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpenses = 0;

  monthIncome.forEach(income => {
    totalIncome += convertCurrency(income.amount, income.currency, currency);
  });

  monthExpenses.forEach(expense => {
    totalExpenses += convertCurrency(expense.amount, expense.currency, currency);
  });

  const remainingAmount = totalIncome - totalExpenses;
  const utilizationPercentage = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(2) : 0;
  const daysRemaining = getDaysRemainingInMonth(currentDate);

  // Calculate suggested daily budget
  const suggestedDailyBudget = daysRemaining > 0 ? (remainingAmount / daysRemaining).toFixed(2) : 0;

  const insights = {
    totalIncome,
    totalExpenses,
    remainingAmount,
    utilizationPercentage,
    daysRemaining,
    suggestedDailyBudget,
    suggestions: []
  };

  // Generate suggestions
  if (utilizationPercentage > 90) {
    insights.suggestions.push('You have used over 90% of your income. Consider reducing expenses.');
  } else if (utilizationPercentage > 70) {
    insights.suggestions.push('You have used 70% of your income. Monitor your spending carefully.');
  } else if (utilizationPercentage < 50) {
    insights.suggestions.push('Great job! You have managed to save more than 50% of your income.');
  }

  if (daysRemaining > 0) {
    insights.suggestions.push(`You have ${daysRemaining} days left this month. Suggested daily budget: ${currency} ${suggestedDailyBudget}`);
  }

  return { success: true, insights };
};

/**
 * Update income
 * @param {string} userId - User ID
 * @param {string} incomeId - Income ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated income
 */
const updateIncome = async (userId, incomeId, updateData) => {
  const income = await Income.findOneAndUpdate(
    { _id: incomeId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!income) {
    return { success: false, errors: ['Income not found'] };
  }

  return { success: true, income };
};

/**
 * Delete income
 * @param {string} userId - User ID
 * @param {string} incomeId - Income ID
 * @returns {Promise<object>} Result
 */
const deleteIncome = async (userId, incomeId) => {
  const income = await Income.findOneAndDelete({ _id: incomeId, userId });

  if (!income) {
    return { success: false, errors: ['Income not found'] };
  }

  return { success: true, message: 'Income deleted' };
};

module.exports = {
  createIncome,
  getIncome,
  getIncomeInsights,
  updateIncome,
  deleteIncome
};
