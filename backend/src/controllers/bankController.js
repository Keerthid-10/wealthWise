const bankService = require('../services/bankService');
const User = require('../models/User');

/**
 * @route   GET /api/bank/transactions
 * @desc    Fetch transactions from bank
 * @access  Private
 */
const getBankTransactions = async (req, res) => {
  try {
    const result = await bankService.fetchBankTransactions();
    res.json(result);
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/bank/import
 * @desc    Import expenses from bank
 * @access  Private
 */
const importFromBank = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's currency preference
    const user = await User.findById(userId);
    const userCurrency = user?.currency || 'INR';

    const result = await bankService.importFromBank(userId, userCurrency);

    res.json({
      success: true,
      message: 'Bank import completed',
      data: result.results
    });
  } catch (error) {
    console.error('Error importing from bank:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/bank/categorize-suggestion
 * @desc    Get category suggestions for an expense
 * @access  Private
 */
const getCategorySuggestion = async (req, res) => {
  try {
    const userId = req.userId;
    const { merchant, description } = req.body;

    if (!merchant && !description) {
      return res.status(400).json({
        success: false,
        message: 'Merchant or description required'
      });
    }

    const suggestions = await bankService.getCategorySuggestions(
      userId,
      merchant || '',
      description || ''
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting category suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBankTransactions,
  importFromBank,
  getCategorySuggestion
};
