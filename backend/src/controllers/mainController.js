const expenseService = require('../services/expenseService');
const incomeService = require('../services/incomeService');
const budgetService = require('../services/budgetService');
const goalService = require('../services/goalService');
const recurringService = require('../services/recurringExpenseService');
const savingsService = require('../services/savingsService');
const analyticsService = require('../services/analyticsService');

// Expense Controllers
const expenseController = {
  create: async (userId, data) => await expenseService.createExpense(userId, data),
  import: async (userId, data) => await expenseService.importExpenses(userId, data),
  getAll: async (userId, filters) => await expenseService.getExpenses(userId, filters),
  getDailySummary: async (userId, date, currency) => await expenseService.getDailySummary(userId, date, currency),
  getByCategory: async (userId, start, end, currency) => await expenseService.getExpensesByCategory(userId, start, end, currency),
  getByMerchant: async (userId, start, end, currency) => await expenseService.getExpensesByMerchant(userId, start, end, currency),
  getHistorical: async (userId, currency) => await expenseService.getHistoricalExpenses(userId, currency),
  update: async (userId, id, data) => await expenseService.updateExpense(userId, id, data),
  delete: async (userId, id) => await expenseService.deleteExpense(userId, id)
};

// Income Controllers
const incomeController = {
  create: async (userId, data) => await incomeService.createIncome(userId, data),
  getAll: async (userId, filters) => await incomeService.getIncome(userId, filters),
  getInsights: async (userId, date, currency) => await incomeService.getIncomeInsights(userId, date, currency),
  update: async (userId, id, data) => await incomeService.updateIncome(userId, id, data),
  delete: async (userId, id) => await incomeService.deleteIncome(userId, id)
};

// Budget Controllers
const budgetController = {
  create: async (userId, data) => await budgetService.createBudget(userId, data),
  getActive: async (userId) => await budgetService.getActiveBudget(userId),
  checkStatus: async (userId, date, currency) => await budgetService.checkBudgetStatus(userId, date, currency),
  getAll: async (userId) => await budgetService.getAllBudgets(userId),
  update: async (userId, id, data) => await budgetService.updateBudget(userId, id, data),
  delete: async (userId, id) => await budgetService.deleteBudget(userId, id)
};

// Goal Controllers
const goalController = {
  create: async (userId, data) => await goalService.createGoal(userId, data),
  getAll: async (userId, status) => await goalService.getGoals(userId, status),
  updateProgress: async (userId, id, amount) => await goalService.updateGoalProgress(userId, id, amount),
  update: async (userId, id, data) => await goalService.updateGoal(userId, id, data),
  delete: async (userId, id) => await goalService.deleteGoal(userId, id)
};

// Recurring Expense Controllers
const recurringController = {
  create: async (userId, data) => await recurringService.createRecurringExpense(userId, data),
  getAll: async (userId) => await recurringService.getRecurringExpenses(userId),
  process: async (userId, date) => await recurringService.processRecurringExpenses(userId, date),
  update: async (userId, id, data) => await recurringService.updateRecurringExpense(userId, id, data),
  delete: async (userId, id) => await recurringService.deleteRecurringExpense(userId, id)
};

// Savings Controllers
const savingsController = {
  getAccount: async (userId) => await savingsService.getSavingsAccount(userId),
  deposit: async (userId, amount, reason) => await savingsService.depositToSavings(userId, amount, reason),
  withdraw: async (userId, amount, reason) => await savingsService.withdrawFromSavings(userId, amount, reason),
  reviewMonthly: async (userId, date) => await savingsService.reviewMonthlySavings(userId, date),
  getSummary: async (userId) => await savingsService.getSavingsSummary(userId),
  restoreAll: async (userId) => await savingsService.restoreAllBudgetWithdrawals(userId)
};

// Analytics Controllers
const analyticsController = {
  getWeeklySummary: async (userId, date, currency) => await analyticsService.getWeeklySummary(userId, date, currency),
  shouldShowWeekly: (date) => analyticsService.shouldShowWeeklySummary(date),
  getPatterns: async (userId, start, end, currency) => await analyticsService.getSpendingPatterns(userId, start, end, currency),
  getInsights: async (userId, date, currency) => await analyticsService.getFinancialInsights(userId, date, currency),
  getDashboard: async (userId, date, currency) => await analyticsService.getDashboardData(userId, date, currency)
};

module.exports = {
  expenseController,
  incomeController,
  budgetController,
  goalController,
  recurringController,
  savingsController,
  analyticsController
};
