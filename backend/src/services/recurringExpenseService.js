const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const { getCurrentDate } = require('../utils/dateUtils');

/**
 * Create recurring expense
 * @param {string} userId - User ID
 * @param {object} recurringData - Recurring expense data
 * @returns {Promise<object>} Created recurring expense
 */
const createRecurringExpense = async (userId, recurringData) => {
  if (!recurringData.title || !recurringData.amount || !recurringData.category) {
    return { success: false, errors: ['Title, amount, and category are required'] };
  }

  const recurring = await RecurringExpense.create({
    userId,
    ...recurringData
  });

  return { success: true, recurring };
};

/**
 * Get user recurring expenses
 * @param {string} userId - User ID
 * @returns {Promise<object>} Recurring expenses
 */
const getRecurringExpenses = async (userId) => {
  const recurring = await RecurringExpense.find({ userId, isActive: true }).sort({ dayOfMonth: 1 });

  return { success: true, recurring };
};

/**
 * Process recurring expenses for current date
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date from client
 * @returns {Promise<object>} Processing result
 */
const processRecurringExpenses = async (userId, currentDate) => {
  const today = getCurrentDate(currentDate);
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay();

  // Find recurring expenses that need to be processed
  const recurringExpenses = await RecurringExpense.find({
    userId,
    isActive: true,
    $or: [
      { frequency: 'monthly', dayOfMonth },
      { frequency: 'weekly', dayOfWeek }
    ]
  });

  const processed = [];
  const skipped = [];

  for (const recurring of recurringExpenses) {
    // Check if already processed today
    if (recurring.lastProcessedDate) {
      const lastProcessed = new Date(recurring.lastProcessedDate);
      if (lastProcessed.toDateString() === today.toDateString()) {
        skipped.push(recurring);
        continue;
      }
    }

    // Create expense
    try {
      const expense = await Expense.create({
        userId,
        amount: recurring.amount,
        currency: recurring.currency,
        category: recurring.category,
        merchant: recurring.merchant,
        description: `${recurring.title} (Recurring)`,
        date: today,
        isRecurring: true,
        recurringExpenseId: recurring._id
      });

      // Update last processed date
      recurring.lastProcessedDate = today;
      await recurring.save();

      processed.push({ recurring, expense });
    } catch (error) {
      skipped.push({ recurring, error: error.message });
    }
  }

  return {
    success: true,
    processed: processed.length,
    skipped: skipped.length,
    details: { processed, skipped }
  };
};

/**
 * Update recurring expense
 * @param {string} userId - User ID
 * @param {string} recurringId - Recurring expense ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated recurring expense
 */
const updateRecurringExpense = async (userId, recurringId, updateData) => {
  const recurring = await RecurringExpense.findOneAndUpdate(
    { _id: recurringId, userId },
    updateData,
    { new: true, runValidators: false } // Allow dynamic fields
  );

  if (!recurring) {
    return { success: false, errors: ['Recurring expense not found'] };
  }

  return { success: true, recurring };
};

/**
 * Delete recurring expense
 * @param {string} userId - User ID
 * @param {string} recurringId - Recurring expense ID
 * @returns {Promise<object>} Result
 */
const deleteRecurringExpense = async (userId, recurringId) => {
  const recurring = await RecurringExpense.findOneAndDelete({
    _id: recurringId,
    userId
  });

  if (!recurring) {
    return { success: false, errors: ['Recurring expense not found'] };
  }

  return { success: true, message: 'Recurring expense deleted' };
};

module.exports = {
  createRecurringExpense,
  getRecurringExpenses,
  processRecurringExpenses,
  updateRecurringExpense,
  deleteRecurringExpense
};
