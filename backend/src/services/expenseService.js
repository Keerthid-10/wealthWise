const Expense = require('../models/Expense');
const { validateExpense } = require('../utils/validation');
const { convertCurrency } = require('../utils/currencyConverter');
const { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getLastNMonthsRange } = require('../utils/dateUtils');

/**
 * Create new expense
 * @param {string} userId - User ID
 * @param {object} expenseData - Expense data
 * @returns {Promise<object>} Created expense
 */
const createExpense = async (userId, expenseData) => {
  const validation = validateExpense(expenseData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const expense = await Expense.create({
    userId,
    ...expenseData
  });

  return { success: true, expense };
};

/**
 * Import expenses from JSON
 * @param {string} userId - User ID
 * @param {array} expensesData - Array of expenses
 * @returns {Promise<object>} Import result
 */
const importExpenses = async (userId, expensesData) => {
  if (!Array.isArray(expensesData)) {
    return { success: false, errors: ['Invalid data format'] };
  }

  const imported = [];
  const failed = [];

  for (const expenseData of expensesData) {
    try {
      const validation = validateExpense(expenseData);
      if (validation.isValid) {
        const expense = await Expense.create({
          userId,
          ...expenseData
        });
        imported.push(expense);
      } else {
        failed.push({ data: expenseData, errors: validation.errors });
      }
    } catch (error) {
      failed.push({ data: expenseData, error: error.message });
    }
  }

  return {
    success: true,
    imported: imported.length,
    failed: failed.length,
    details: { imported, failed }
  };
};

/**
 * Get user expenses with filters
 * @param {string} userId - User ID
 * @param {object} filters - Filter criteria
 * @returns {Promise<object>} Expenses list
 */
const getExpenses = async (userId, filters = {}) => {
  const query = { userId };

  // Date filters
  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: getStartOfDay(new Date(filters.startDate)),
      $lte: getEndOfDay(new Date(filters.endDate))
    };
  } else if (filters.date) {
    query.date = {
      $gte: getStartOfDay(new Date(filters.date)),
      $lte: getEndOfDay(new Date(filters.date))
    };
  }

  // Category filter
  if (filters.category) {
    query.category = filters.category;
  }

  // Merchant filter
  if (filters.merchant) {
    query.merchant = new RegExp(filters.merchant, 'i');
  }

  const expenses = await Expense.find(query).sort({ date: -1 });

  return { success: true, expenses };
};

/**
 * Get daily expense summary
 * @param {string} userId - User ID
 * @param {Date} date - Date for summary
 * @param {string} currency - User currency
 * @returns {Promise<object>} Daily summary
 */
const getDailySummary = async (userId, date, currency = 'INR') => {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  const summary = {
    date: date,
    totalExpenses: 0,
    count: expenses.length,
    byCategory: {},
    byMerchant: {}
  };

  expenses.forEach(expense => {
    const amount = convertCurrency(expense.amount, expense.currency, currency);
    summary.totalExpenses += amount;

    // Group by category
    if (!summary.byCategory[expense.category]) {
      summary.byCategory[expense.category] = 0;
    }
    summary.byCategory[expense.category] += amount;

    // Group by merchant
    if (expense.merchant) {
      if (!summary.byMerchant[expense.merchant]) {
        summary.byMerchant[expense.merchant] = 0;
      }
      summary.byMerchant[expense.merchant] += amount;
    }
  });

  return { success: true, summary };
};

/**
 * Get expenses by category
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Category breakdown
 */
const getExpensesByCategory = async (userId, startDate, endDate, currency = 'INR') => {
  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });

  const categoryData = {};

  expenses.forEach(expense => {
    const amount = convertCurrency(expense.amount, expense.currency, currency);
    if (!categoryData[expense.category]) {
      categoryData[expense.category] = {
        total: 0,
        count: 0,
        transactions: []
      };
    }
    categoryData[expense.category].total += amount;
    categoryData[expense.category].count += 1;
    categoryData[expense.category].transactions.push(expense);
  });

  return { success: true, categoryData };
};

/**
 * Get expenses by merchant
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Merchant breakdown
 */
const getExpensesByMerchant = async (userId, startDate, endDate, currency = 'INR') => {
  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ merchant: 1 });

  const merchantData = {};

  expenses.forEach(expense => {
    if (!expense.merchant) return;

    const amount = convertCurrency(expense.amount, expense.currency, currency);
    if (!merchantData[expense.merchant]) {
      merchantData[expense.merchant] = {
        total: 0,
        count: 0,
        transactions: []
      };
    }
    merchantData[expense.merchant].total += amount;
    merchantData[expense.merchant].count += 1;
    merchantData[expense.merchant].transactions.push(expense);
  });

  return { success: true, merchantData };
};

/**
 * Get historical expenses (last 3 months)
 * @param {string} userId - User ID
 * @param {string} currency - User currency
 * @returns {Promise<object>} Historical data
 */
const getHistoricalExpenses = async (userId, currency = 'INR') => {
  const { startDate, endDate } = getLastNMonthsRange(3);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });

  // Group by month
  const monthlyData = {};

  expenses.forEach(expense => {
    const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        total: 0,
        count: 0,
        expenses: []
      };
    }

    const amount = convertCurrency(expense.amount, expense.currency, currency);
    monthlyData[monthKey].total += amount;
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].expenses.push(expense);
  });

  return { success: true, monthlyData, expenses };
};

/**
 * Update expense
 * @param {string} userId - User ID
 * @param {string} expenseId - Expense ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated expense
 */
const updateExpense = async (userId, expenseId, updateData) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!expense) {
    return { success: false, errors: ['Expense not found'] };
  }

  return { success: true, expense };
};

/**
 * Delete expense
 * @param {string} userId - User ID
 * @param {string} expenseId - Expense ID
 * @returns {Promise<object>} Result
 */
const deleteExpense = async (userId, expenseId) => {
  const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });

  if (!expense) {
    return { success: false, errors: ['Expense not found'] };
  }

  return { success: true, message: 'Expense deleted' };
};

module.exports = {
  createExpense,
  importExpenses,
  getExpenses,
  getDailySummary,
  getExpensesByCategory,
  getExpensesByMerchant,
  getHistoricalExpenses,
  updateExpense,
  deleteExpense
};
