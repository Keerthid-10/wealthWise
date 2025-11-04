const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { validateBudget } = require('../utils/validation');
const { convertCurrency } = require('../utils/currencyConverter');
const { getStartOfMonth, getEndOfMonth } = require('../utils/dateUtils');

/**
 * Create new monthly budget
 * @param {string} userId - User ID
 * @param {object} budgetData - Budget data
 * @returns {Promise<object>} Created budget
 */
const createBudget = async (userId, budgetData) => {
  // Force budget type to be monthly only
  budgetData.type = 'monthly';

  const validation = validateBudget(budgetData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  // Check if there's already an active monthly budget for this month
  const currentDate = new Date();
  const startOfMonth = getStartOfMonth(currentDate);
  const endOfMonth = getEndOfMonth(currentDate);

  const existingBudget = await Budget.findOne({
    userId,
    type: 'monthly',
    isActive: true,
    startDate: { $gte: startOfMonth },
    endDate: { $lte: endOfMonth }
  });

  if (existingBudget) {
    return { success: false, errors: ['A monthly budget already exists for this period. Please delete the existing budget first.'] };
  }

  // Deactivate all previous monthly budgets
  await Budget.updateMany(
    { userId, type: 'monthly', isActive: true },
    { isActive: false }
  );

  const budget = await Budget.create({
    userId,
    ...budgetData,
    type: 'monthly' // Ensure it's always monthly
  });

  return { success: true, budget };
};

/**
 * Get active monthly budget
 * @param {string} userId - User ID
 * @returns {Promise<object>} Active monthly budget
 */
const getActiveBudget = async (userId) => {
  const budget = await Budget.findOne({
    userId,
    type: 'monthly',
    isActive: true
  });

  if (!budget) {
    return { success: false, errors: ['No active monthly budget found'] };
  }

  return { success: true, budget };
};

/**
 * Check budget status
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date
 * @param {string} currency - User currency
 * @returns {Promise<object>} Budget status
 */
const checkBudgetStatus = async (userId, currentDate, currency = 'INR') => {
  // Check monthly budget
  const monthlyBudget = await Budget.findOne({
    userId,
    type: 'monthly',
    isActive: true
  });

  const status = {
    monthly: null,
    alerts: [],
    monthlyAchievement: null
  };

  // Check monthly budget
  if (monthlyBudget) {
    const startOfMonth = getStartOfMonth(currentDate);
    const endOfMonth = getEndOfMonth(currentDate);

    const monthExpenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalSpent = 0;
    const categorySpent = {};

    monthExpenses.forEach(expense => {
      const amount = convertCurrency(expense.amount, expense.currency, currency);
      totalSpent += amount;

      if (!categorySpent[expense.category]) {
        categorySpent[expense.category] = 0;
      }
      categorySpent[expense.category] += amount;
    });

    const percentage = (totalSpent / monthlyBudget.totalAmount) * 100;

    status.monthly = {
      budgetAmount: monthlyBudget.totalAmount,
      spent: totalSpent,
      remaining: monthlyBudget.totalAmount - totalSpent,
      percentage: percentage.toFixed(2),
      exceeded: totalSpent > monthlyBudget.totalAmount
    };

    // Check category budgets
    if (monthlyBudget.categoryBudgets && monthlyBudget.categoryBudgets.length > 0) {
      status.monthly.categoryStatus = {};

      for (const catBudget of monthlyBudget.categoryBudgets) {
        const spent = categorySpent[catBudget.category] || 0;
        const exceeded = spent > catBudget.amount;

        status.monthly.categoryStatus[catBudget.category] = {
          budgetAmount: catBudget.amount,
          spent,
          remaining: catBudget.amount - spent,
          percentage: ((spent / catBudget.amount) * 100).toFixed(2),
          exceeded
        };

        // Alert for category budget exceeded
        if (exceeded) {
          const exceededAmount = spent - catBudget.amount;

          status.alerts.push({
            type: 'category_exceeded',
            category: catBudget.category,
            message: `${catBudget.category} budget exceeded by ${currency} ${exceededAmount.toFixed(2)}.`,
            amount: exceededAmount,
            spent: spent,
            budget: catBudget.amount
          });
        }
      }
    }

    // Check if total expenses exceed total budget
    if (status.monthly.exceeded) {
      const exceededAmount = totalSpent - monthlyBudget.totalAmount;

      status.alerts.push({
        type: 'budget_exceeded',
        message: `Total budget exceeded! You've spent ${currency} ${totalSpent.toFixed(2)}, which is ${currency} ${exceededAmount.toFixed(2)} over your budget of ${currency} ${monthlyBudget.totalAmount.toFixed(2)}.`,
        amount: exceededAmount,
        totalSpent,
        totalBudget: monthlyBudget.totalAmount
      });
    }

    // Check for monthly achievement (staying within budget)
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const isLastWeekOfMonth = currentDay > daysInMonth - 7;

    if (!status.monthly.exceeded) {
      const spentPercentage = (totalSpent / monthlyBudget.totalAmount) * 100;

      // Show appreciation messages
      if (isLastWeekOfMonth) {
        status.monthlyAchievement = {
          type: 'staying_within_budget',
          message: `Great job! You're staying within your monthly budget with ${spentPercentage.toFixed(1)}% used.`,
          remainingBudget: monthlyBudget.totalAmount - totalSpent,
          spentPercentage: spentPercentage.toFixed(1),
          isLastWeek: true
        };

        status.alerts.push({
          type: 'monthly_appreciation',
          message: `Excellent budget management! You've used only ${spentPercentage.toFixed(1)}% of your monthly budget.`,
          achievement: 'staying_within_budget',
          remainingBudget: monthlyBudget.totalAmount - totalSpent
        });
      } else if (spentPercentage < 30 && currentDay > 10) {
        // Early appreciation for very low spending
        status.alerts.push({
          type: 'early_appreciation',
          message: `Amazing! You're keeping expenses very low with only ${spentPercentage.toFixed(1)}% of budget used.`,
          achievement: 'low_spending',
          spentPercentage: spentPercentage.toFixed(1)
        });
      }
    }

    // End of month celebration (last 3 days)
    if (currentDay >= daysInMonth - 2 && !status.monthly.exceeded) {
      status.alerts.push({
        type: 'month_end_celebration',
        message: `Month almost over and you stayed within budget! You've successfully managed your finances this month.`,
        achievement: 'budget_success',
        savedAmount: monthlyBudget.totalAmount - totalSpent
      });
    }
  }

  return { success: true, status };
};

/**
 * Get all budgets
 * @param {string} userId - User ID
 * @returns {Promise<object>} All budgets
 */
const getAllBudgets = async (userId) => {
  const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });

  return { success: true, budgets };
};

/**
 * Update budget
 * @param {string} userId - User ID
 * @param {string} budgetId - Budget ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated budget
 */
const updateBudget = async (userId, budgetId, updateData) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: budgetId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!budget) {
    return { success: false, errors: ['Budget not found'] };
  }

  return { success: true, budget };
};

/**
 * Delete budget
 * @param {string} userId - User ID
 * @param {string} budgetId - Budget ID
 * @returns {Promise<object>} Result
 */
const deleteBudget = async (userId, budgetId) => {
  const budget = await Budget.findOne({ _id: budgetId, userId });

  if (!budget) {
    return { success: false, errors: ['Budget not found'] };
  }

  // Delete the budget
  await Budget.findOneAndDelete({ _id: budgetId, userId });

  return {
    success: true,
    message: 'Budget deleted successfully.'
  };
};

module.exports = {
  createBudget,
  getActiveBudget,
  checkBudgetStatus,
  getAllBudgets,
  updateBudget,
  deleteBudget
};
