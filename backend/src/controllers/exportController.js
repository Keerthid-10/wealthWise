const Expense = require('../models/Expense');
const { exportExpenses: exportService } = require('../services/exportService');

/**
 * Export expenses to specified format
 * @param {string} userId - User ID
 * @param {string} format - Export format
 * @param {Date} startDate - Start date filter
 * @param {Date} endDate - End date filter
 * @param {string} currency - User currency
 * @returns {Promise<object>} Export result
 */
const exportExpenses = async (userId, format, startDate, endDate, currency) => {
  // Build query
  const query = { userId };

  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query.date = { $gte: startDate };
  } else if (endDate) {
    query.date = { $lte: endDate };
  }

  // Get expenses
  const expenses = await Expense.find(query).sort({ date: -1 });

  // Export using service
  return exportService(expenses, format, currency);
};

module.exports = {
  exportExpenses
};
