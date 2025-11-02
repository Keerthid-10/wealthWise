const FinancialGoal = require('../models/FinancialGoal');
const { validateFinancialGoal } = require('../utils/validation');

/**
 * Create financial goal
 * @param {string} userId - User ID
 * @param {object} goalData - Goal data
 * @returns {Promise<object>} Created goal
 */
const createGoal = async (userId, goalData) => {
  const validation = validateFinancialGoal(goalData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const goal = await FinancialGoal.create({
    userId,
    ...goalData
  });

  return { success: true, goal };
};

/**
 * Get user goals
 * @param {string} userId - User ID
 * @param {string} status - Filter by status
 * @returns {Promise<object>} Goals list
 */
const getGoals = async (userId, status = null) => {
  const query = { userId };
  if (status) {
    query.status = status;
  }

  const goals = await FinancialGoal.find(query).sort({ createdAt: -1 });

  // Calculate progress for each goal
  const goalsWithProgress = goals.map(goal => {
    const progress = goal.targetAmount > 0
      ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(2)
      : 0;

    return {
      ...goal.toObject(),
      progress,
      isCompleted: goal.currentAmount >= goal.targetAmount
    };
  });

  return { success: true, goals: goalsWithProgress };
};

/**
 * Update goal progress
 * @param {string} userId - User ID
 * @param {string} goalId - Goal ID
 * @param {number} amount - Amount to add
 * @returns {Promise<object>} Updated goal
 */
const updateGoalProgress = async (userId, goalId, amount) => {
  const goal = await FinancialGoal.findOne({ _id: goalId, userId });

  if (!goal) {
    return { success: false, errors: ['Goal not found'] };
  }

  goal.currentAmount += amount;

  // Check if goal is completed
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
  }

  await goal.save();

  const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(2);

  return { success: true, goal, progress };
};

/**
 * Update goal
 * @param {string} userId - User ID
 * @param {string} goalId - Goal ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated goal
 */
const updateGoal = async (userId, goalId, updateData) => {
  const goal = await FinancialGoal.findOneAndUpdate(
    { _id: goalId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!goal) {
    return { success: false, errors: ['Goal not found'] };
  }

  return { success: true, goal };
};

/**
 * Delete goal
 * @param {string} userId - User ID
 * @param {string} goalId - Goal ID
 * @returns {Promise<object>} Result
 */
const deleteGoal = async (userId, goalId) => {
  const goal = await FinancialGoal.findOneAndDelete({ _id: goalId, userId });

  if (!goal) {
    return { success: false, errors: ['Goal not found'] };
  }

  return { success: true, message: 'Goal deleted' };
};

module.exports = {
  createGoal,
  getGoals,
  updateGoalProgress,
  updateGoal,
  deleteGoal
};
