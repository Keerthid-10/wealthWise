const {
  fetchBankTransactions,
  importTransactions,
  getCategorizationSuggestion
} = require('../services/bankService');

const getBankTransactions = async (req, res) => {
  try {
    const transactions = await fetchBankTransactions();
    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const importFromBank = async (req, res) => {
  try {
    const result = await importTransactions(req.userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const suggestCategory = async (req, res) => {
  try {
    const { description, merchant } = req.body;

    if (!description && !merchant) {
      return res.status(400).json({
        success: false,
        message: 'Please provide description or merchant'
      });
    }

    const suggestion = getCategorizationSuggestion(description, merchant);

    res.status(200).json({
      success: true,
      ...suggestion
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBankTransactions,
  importFromBank,
  suggestCategory
};
