const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { convertCurrency } = require('../utils/currencyConverter');
const { getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, isWeekend } = require('../utils/dateUtils');

/**
 * Get weekly summary
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Weekly summary
 */
const getWeeklySummary = async (userId, currentDate, currency = 'INR') => {
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = getEndOfWeek(currentDate);

  // Get this week's expenses
  const weekExpenses = await Expense.find({
    userId,
    date: { $gte: startOfWeek, $lte: endOfWeek }
  });

  // Get last week's expenses for comparison
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(endOfWeek);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const lastWeekExpenses = await Expense.find({
    userId,
    date: { $gte: lastWeekStart, $lte: lastWeekEnd }
  });

  // Calculate totals by category
  const categoryTotals = {};
  let thisWeekTotal = 0;

  weekExpenses.forEach(expense => {
    const amount = convertCurrency(expense.amount, expense.currency, currency);
    thisWeekTotal += amount;

    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += amount;
  });

  // Get top 3 spending categories
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount }));

  // Calculate last week total
  let lastWeekTotal = 0;
  lastWeekExpenses.forEach(expense => {
    lastWeekTotal += convertCurrency(expense.amount, expense.currency, currency);
  });

  // Calculate comparison
  const difference = lastWeekTotal - thisWeekTotal;
  const percentageChange = lastWeekTotal > 0
    ? ((difference / lastWeekTotal) * 100).toFixed(2)
    : 0;

  const summary = {
    weekStart: startOfWeek,
    weekEnd: endOfWeek,
    thisWeekTotal,
    lastWeekTotal,
    difference,
    percentageChange,
    topCategories: sortedCategories,
    insights: []
  };

  // Generate insights
  if (difference > 0) {
    summary.insights.push(`Great job! You spent ${Math.abs(percentageChange)}% less than last week!`);
  } else if (difference < 0) {
    summary.insights.push(`You spent ${Math.abs(percentageChange)}% more than last week.`);
  }

  if (sortedCategories.length > 0) {
    summary.insights.push(`Top 3 spending categories this week: ${sortedCategories.map(c => c.category).join(', ')}`);
  }

  return { success: true, summary };
};

/**
 * Check if should show weekly summary (weekends)
 * @param {Date} currentDate - Current date
 * @returns {boolean} Should show weekly summary
 */
const shouldShowWeeklySummary = (currentDate) => {
  return isWeekend(currentDate);
};

/**
 * Get spending patterns
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Spending patterns
 */
const getSpendingPatterns = async (userId, startDate, endDate, currency = 'INR') => {
  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  // Group by category
  const byCategory = {};
  // Group by merchant
  const byMerchant = {};
  // Group by date
  const byDate = {};
  // Total
  let total = 0;

  expenses.forEach(expense => {
    const amount = convertCurrency(expense.amount, expense.currency, currency);
    total += amount;

    // By category
    if (!byCategory[expense.category]) {
      byCategory[expense.category] = { total: 0, count: 0 };
    }
    byCategory[expense.category].total += amount;
    byCategory[expense.category].count += 1;

    // By merchant
    if (expense.merchant) {
      if (!byMerchant[expense.merchant]) {
        byMerchant[expense.merchant] = { total: 0, count: 0 };
      }
      byMerchant[expense.merchant].total += amount;
      byMerchant[expense.merchant].count += 1;
    }

    // By date
    const dateKey = expense.date.toISOString().split('T')[0];
    if (!byDate[dateKey]) {
      byDate[dateKey] = { total: 0, count: 0 };
    }
    byDate[dateKey].total += amount;
    byDate[dateKey].count += 1;
  });

  return {
    success: true,
    patterns: {
      total,
      count: expenses.length,
      byCategory,
      byMerchant,
      byDate,
      averagePerDay: total / Object.keys(byDate).length || 0
    }
  };
};

/**
 * Get financial insights
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Financial insights
 */
const getFinancialInsights = async (userId, currentDate, currency = 'INR') => {
  const startOfMonth = getStartOfMonth(currentDate);
  const endOfMonth = getEndOfMonth(currentDate);

  // Get month data
  const [monthExpenses, monthIncome] = await Promise.all([
    Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
    Income.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } })
  ]);

  let totalExpenses = 0;
  let totalIncome = 0;
  const categorySpending = {};

  monthExpenses.forEach(expense => {
    const amount = convertCurrency(expense.amount, expense.currency, currency);
    totalExpenses += amount;

    if (!categorySpending[expense.category]) {
      categorySpending[expense.category] = 0;
    }
    categorySpending[expense.category] += amount;
  });

  monthIncome.forEach(income => {
    totalIncome += convertCurrency(income.amount, income.currency, currency);
  });

  // Find highest spending category
  let highestCategory = null;
  let highestAmount = 0;

  Object.entries(categorySpending).forEach(([category, amount]) => {
    if (amount > highestAmount) {
      highestCategory = category;
      highestAmount = amount;
    }
  });

  const insights = {
    totalExpenses,
    totalIncome,
    netSavings: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0,
    highestSpendingCategory: highestCategory,
    highestSpendingAmount: highestAmount,
    recommendations: []
  };

  // Generate recommendations
  if (insights.savingsRate < 20) {
    insights.recommendations.push('Your savings rate is low. Try to reduce expenses in non-essential categories.');
  } else if (insights.savingsRate > 50) {
    insights.recommendations.push('Excellent! You are saving more than 50% of your income.');
  }

  if (highestCategory) {
    insights.recommendations.push(`Your highest spending is in ${highestCategory}. Consider reviewing this category.`);
  }

  return { success: true, insights };
};

/**
 * Get dashboard data
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Dashboard data
 */
const getDashboardData = async (userId, currentDate, currency = 'INR') => {
  const startOfMonth = getStartOfMonth(currentDate);
  const endOfMonth = getEndOfMonth(currentDate);

  const [expenses, income, patterns, insightsResponse] = await Promise.all([
    Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
    Income.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
    getSpendingPatterns(userId, startOfMonth, endOfMonth, currency),
    getFinancialInsights(userId, currentDate, currency)
  ]);

  return {
    success: true,
    dashboard: {
      expenses: expenses.length,
      income: income.length,
      patterns: patterns.patterns,
      insights: insightsResponse.insights  // Extract insights from the response
    }
  };
};

module.exports = {
  getWeeklySummary,
  shouldShowWeeklySummary,
  getSpendingPatterns,
  getFinancialInsights,
  getDashboardData
};
