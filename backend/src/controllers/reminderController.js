const RecurringExpense = require('../models/RecurringExpense');
const Budget = require('../models/Budget');
const FinancialGoal = require('../models/FinancialGoal');
const { formatCurrency } = require('../utils/currencyConverter');

/**
 * Get reminders for user
 * @param {string} userId - User ID
 * @param {Date} currentDate - Current date
 * @returns {Promise<object>} Reminders
 */
const getReminders = async (userId, currentDate) => {
  const reminders = [];
  const today = new Date(currentDate);
  const dayOfMonth = today.getDate();

  // Get upcoming recurring expenses (within next 3 days)
  const recurringExpenses = await RecurringExpense.find({
    userId,
    isActive: true
  });

  recurringExpenses.forEach(recurring => {
    if (recurring.dayOfMonth) {
      const daysUntilDue = recurring.dayOfMonth - dayOfMonth;

      if (daysUntilDue > 0 && daysUntilDue <= 3) {
        reminders.push({
          type: 'recurring_expense',
          priority: daysUntilDue === 1 ? 'high' : 'medium',
          message: `Pay ${recurring.title} in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
          data: {
            title: recurring.title,
            amount: formatCurrency(recurring.amount, recurring.currency),
            daysUntil: daysUntilDue
          }
        });
      } else if (daysUntilDue === 0) {
        reminders.push({
          type: 'recurring_expense',
          priority: 'urgent',
          message: `Pay ${recurring.title} today!`,
          data: {
            title: recurring.title,
            amount: formatCurrency(recurring.amount, recurring.currency),
            daysUntil: 0
          }
        });
      }
    }
  });

  // Check for goals nearing deadline
  const goals = await FinancialGoal.find({
    userId,
    status: 'active'
  });

  goals.forEach(goal => {
    if (goal.endDate) {
      const daysUntilDeadline = Math.ceil((new Date(goal.endDate) - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDeadline > 0 && daysUntilDeadline <= 7) {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount * 100).toFixed(0) : 0;

        reminders.push({
          type: 'financial_goal',
          priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
          message: `Goal "${goal.title}" deadline in ${daysUntilDeadline} days (${progress}% complete)`,
          data: {
            title: goal.title,
            progress,
            daysUntil: daysUntilDeadline,
            remaining: formatCurrency(goal.targetAmount - goal.currentAmount, goal.currency)
          }
        });
      }
    }
  });

  // Check budget status
  const activeBudgets = await Budget.find({
    userId,
    isActive: true,
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  // Add budget reminders if needed (can be enhanced with expense checking)
  activeBudgets.forEach(budget => {
    const daysUntilEnd = Math.ceil((new Date(budget.endDate) - today) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd <= 3 && daysUntilEnd > 0) {
      reminders.push({
        type: 'budget',
        priority: 'low',
        message: `Budget period ends in ${daysUntilEnd} day${daysUntilEnd > 1 ? 's' : ''}`,
        data: {
          type: budget.type,
          daysUntil: daysUntilEnd
        }
      });
    }
  });

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  reminders.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    success: true,
    reminders,
    count: reminders.length
  };
};

module.exports = {
  getReminders
};
