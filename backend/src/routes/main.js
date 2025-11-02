const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  expenseController,
  incomeController,
  budgetController,
  goalController,
  recurringController,
  savingsController,
  analyticsController
} = require('../controllers/mainController');
const bankController = require('../controllers/bankController');

// Helper function to handle responses
const handleResponse = async (res, controllerFn) => {
  try {
    const result = await controllerFn();
    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }
    res.json(result);
  } catch (error) {
    logger.error('Route error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== EXPENSE ROUTES =====
router.post('/expenses', auth, async (req, res) => {
  await handleResponse(res, () => expenseController.create(req.userId, req.body));
});

router.post('/expenses/import', auth, async (req, res) => {
  await handleResponse(res, () => expenseController.import(req.userId, req.body.expenses));
});

router.get('/expenses', auth, async (req, res) => {
  await handleResponse(res, () => expenseController.getAll(req.userId, req.query));
});

router.get('/expenses/daily-summary', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => expenseController.getDailySummary(req.userId, date, req.query.currency));
});

router.get('/expenses/by-category', auth, async (req, res) => {
  const start = new Date(req.query.startDate);
  const end = new Date(req.query.endDate);
  await handleResponse(res, () => expenseController.getByCategory(req.userId, start, end, req.query.currency));
});

router.get('/expenses/by-merchant', auth, async (req, res) => {
  const start = new Date(req.query.startDate);
  const end = new Date(req.query.endDate);
  await handleResponse(res, () => expenseController.getByMerchant(req.userId, start, end, req.query.currency));
});

router.get('/expenses/historical', auth, async (req, res) => {
  await handleResponse(res, () => expenseController.getHistorical(req.userId, req.query.currency));
});

router.put('/expenses/:id', auth, async (req, res) => {
  await handleResponse(res, () => expenseController.update(req.userId, req.params.id, req.body));
});

router.delete('/expenses/:id', auth, async (req, res) => {
  await handleResponse(res, () => expenseController.delete(req.userId, req.params.id));
});

// ===== INCOME ROUTES =====
router.post('/income', auth, async (req, res) => {
  await handleResponse(res, () => incomeController.create(req.userId, req.body));
});

router.get('/income', auth, async (req, res) => {
  await handleResponse(res, () => incomeController.getAll(req.userId, req.query));
});

router.get('/income/insights', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => incomeController.getInsights(req.userId, date, req.query.currency));
});

router.put('/income/:id', auth, async (req, res) => {
  await handleResponse(res, () => incomeController.update(req.userId, req.params.id, req.body));
});

router.delete('/income/:id', auth, async (req, res) => {
  await handleResponse(res, () => incomeController.delete(req.userId, req.params.id));
});

// ===== BUDGET ROUTES =====
router.post('/budgets', auth, async (req, res) => {
  await handleResponse(res, () => budgetController.create(req.userId, req.body));
});

router.get('/budgets/active', auth, async (req, res) => {
  await handleResponse(res, () => budgetController.getActive(req.userId));
});

router.get('/budgets/status', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => budgetController.checkStatus(req.userId, date, req.query.currency));
});

router.get('/budgets', auth, async (req, res) => {
  await handleResponse(res, () => budgetController.getAll(req.userId));
});

router.put('/budgets/:id', auth, async (req, res) => {
  await handleResponse(res, () => budgetController.update(req.userId, req.params.id, req.body));
});

router.delete('/budgets/:id', auth, async (req, res) => {
  await handleResponse(res, () => budgetController.delete(req.userId, req.params.id));
});

// ===== FINANCIAL GOALS ROUTES =====
router.post('/goals', auth, async (req, res) => {
  await handleResponse(res, () => goalController.create(req.userId, req.body));
});

router.get('/goals', auth, async (req, res) => {
  await handleResponse(res, () => goalController.getAll(req.userId, req.query.status));
});

router.put('/goals/:id/progress', auth, async (req, res) => {
  await handleResponse(res, () => goalController.updateProgress(req.userId, req.params.id, req.body.amount));
});

router.put('/goals/:id', auth, async (req, res) => {
  await handleResponse(res, () => goalController.update(req.userId, req.params.id, req.body));
});

router.delete('/goals/:id', auth, async (req, res) => {
  await handleResponse(res, () => goalController.delete(req.userId, req.params.id));
});

// ===== RECURRING EXPENSES ROUTES =====
router.post('/recurring-expenses', auth, async (req, res) => {
  await handleResponse(res, () => recurringController.create(req.userId, req.body));
});

router.get('/recurring-expenses', auth, async (req, res) => {
  await handleResponse(res, () => recurringController.getAll(req.userId));
});

router.post('/recurring-expenses/process', auth, async (req, res) => {
  const date = req.body.date ? new Date(req.body.date) : new Date();
  await handleResponse(res, () => recurringController.process(req.userId, date));
});

router.put('/recurring-expenses/:id', auth, async (req, res) => {
  await handleResponse(res, () => recurringController.update(req.userId, req.params.id, req.body));
});

router.delete('/recurring-expenses/:id', auth, async (req, res) => {
  await handleResponse(res, () => recurringController.delete(req.userId, req.params.id));
});

// ===== SAVINGS ROUTES =====
router.get('/savings', auth, async (req, res) => {
  await handleResponse(res, () => savingsController.getAccount(req.userId));
});

router.post('/savings/deposit', auth, async (req, res) => {
  await handleResponse(res, () => savingsController.deposit(req.userId, req.body.amount, req.body.reason));
});

router.post('/savings/withdraw', auth, async (req, res) => {
  await handleResponse(res, () => savingsController.withdraw(req.userId, req.body.amount, req.body.reason));
});

router.get('/savings/review', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => savingsController.reviewMonthly(req.userId, date));
});

router.get('/savings/summary', auth, async (req, res) => {
  await handleResponse(res, () => savingsController.getSummary(req.userId));
});

router.post('/savings/restore-all', auth, async (req, res) => {
  await handleResponse(res, () => savingsController.restoreAll(req.userId));
});

// ===== ANALYTICS ROUTES =====
router.get('/analytics/weekly-summary', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => analyticsController.getWeeklySummary(req.userId, date, req.query.currency));
});

router.get('/analytics/patterns', auth, async (req, res) => {
  const start = new Date(req.query.startDate);
  const end = new Date(req.query.endDate);
  await handleResponse(res, () => analyticsController.getPatterns(req.userId, start, end, req.query.currency));
});

router.get('/analytics/insights', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => analyticsController.getInsights(req.userId, date, req.query.currency));
});

router.get('/analytics/dashboard', auth, async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  await handleResponse(res, () => analyticsController.getDashboard(req.userId, date, req.query.currency));
});

// ===== EXPORT ROUTES =====
router.post('/expenses/export', auth, async (req, res) => {
  try {
    const { format, startDate, endDate } = req.body;
    const exportController = require('../controllers/exportController');
    const User = require('../models/User');

    // Get user's currency
    const user = await User.findById(req.userId);
    const currency = user?.currency || 'INR';

    const result = await exportController.exportExpenses(
      req.userId,
      format || 'excel',
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      currency
    );

    if (!result.success) {
      return res.status(400).json({ errors: [result.error] });
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    logger.error('Export error', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===== REMINDERS AND NOTIFICATIONS =====
router.get('/reminders', auth, async (req, res) => {
  try {
    const reminderController = require('../controllers/reminderController');
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await reminderController.getReminders(req.userId, date);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result);
  } catch (error) {
    logger.error('Reminders error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== BANK INTEGRATION ROUTES =====
router.get('/bank/transactions', auth, async (req, res) => {
  await bankController.getBankTransactions(req, res);
});

router.post('/bank/import', auth, async (req, res) => {
  await bankController.importFromBank(req, res);
});

router.post('/bank/categorize-suggestion', auth, async (req, res) => {
  await bankController.getCategorySuggestion(req, res);
});

module.exports = router;
