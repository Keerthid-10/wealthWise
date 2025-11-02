const axios = require('axios');
const Expense = require('../models/Expense');

const BANK_API_URL = process.env.BANK_API_URL
  ? `${process.env.BANK_API_URL}/api/bank`
  : 'http://localhost:3002/api/bank';

/**
 * Fetch transactions from bank API
 * @returns {Promise<Object>} Bank transactions
 */
const fetchBankTransactions = async () => {
  try {
    const response = await axios.get(`${BANK_API_URL}/transactions/export`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch bank transactions: ${error.message}`);
  }
};

/**
 * Import expenses from bank with auto-categorization and duplicate prevention
 * @param {String} userId - User ID
 * @param {String} userCurrency - User's preferred currency
 * @returns {Promise<Object>} Import result
 */
const importFromBank = async (userId, userCurrency = 'INR') => {
  try {
    // Fetch transactions from bank API
    const bankResponse = await fetchBankTransactions();

    if (!bankResponse.success || !bankResponse.data) {
      throw new Error('Invalid response from bank API');
    }

    const transactions = bankResponse.data;
    const results = {
      total: transactions.length,
      imported: 0,
      duplicates: 0,
      categorized: 0,
      errors: []
    };

    const importedTransactionIds = [];

    for (const transaction of transactions) {
      try {
        // Skip if already imported
        if (transaction.alreadyImported) {
          results.duplicates++;
          continue;
        }

        // Check if transaction already exists in database
        const existingExpense = await Expense.findOne({
          bankTransactionId: transaction.bankTransactionId
        });

        if (existingExpense) {
          results.duplicates++;
          continue;
        }

        // Auto-categorize based on transaction history if category is 'Others'
        let finalCategory = transaction.category;
        if (transaction.category === 'Others' || !transaction.category) {
          finalCategory = await autoCategorizeExpense(
            userId,
            transaction.merchant,
            transaction.description
          );
          results.categorized++;
        }

        // Create expense
        const expense = new Expense({
          userId,
          amount: transaction.amount,
          currency: userCurrency,
          category: finalCategory,
          merchant: transaction.merchant,
          description: transaction.description,
          date: transaction.date,
          paymentMethod: transaction.paymentMethod,
          bankTransactionId: transaction.bankTransactionId
        });

        await expense.save();
        results.imported++;
        importedTransactionIds.push(transaction.bankTransactionId);
      } catch (error) {
        results.errors.push({
          transaction: transaction.bankTransactionId,
          error: error.message
        });
      }
    }

    // Mark transactions as imported in bank API
    if (importedTransactionIds.length > 0) {
      try {
        await axios.post(`${BANK_API_URL}/transactions/mark-imported`, {
          transactionIds: importedTransactionIds
        });
      } catch (error) {
        console.error('Failed to mark transactions as imported:', error.message);
      }
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    throw new Error(`Failed to import from bank: ${error.message}`);
  }
};

/**
 * Auto-categorize expense based on transaction history
 * @param {String} userId - User ID
 * @param {String} merchant - Merchant name
 * @param {String} description - Transaction description
 * @returns {Promise<String>} Category
 */
const autoCategorizeExpense = async (userId, merchant, description) => {
  try {
    // Find previous transactions with the same merchant
    const previousExpenses = await Expense.find({
      userId,
      $or: [
        { merchant: { $regex: new RegExp(merchant, 'i') } },
        { description: { $regex: new RegExp(merchant, 'i') } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (previousExpenses.length > 0) {
      // Find the most common category for this merchant
      const categoryCount = {};
      previousExpenses.forEach(expense => {
        categoryCount[expense.category] = (categoryCount[expense.category] || 0) + 1;
      });

      // Return the most frequent category
      const mostCommonCategory = Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b
      );

      return mostCommonCategory;
    }

    // If no history found, use keyword-based categorization
    return categorizeByKeywords(merchant, description);
  } catch (error) {
    console.error('Error in auto-categorization:', error);
    return 'Others';
  }
};

/**
 * Categorize based on keywords
 * @param {String} merchant - Merchant name
 * @param {String} description - Transaction description
 * @returns {String} Category
 */
const categorizeByKeywords = (merchant, description) => {
  const text = `${merchant} ${description}`.toLowerCase();

  const categoryMap = {
    'Food': ['grocery', 'restaurant', 'zomato', 'swiggy', 'food', 'cafe', 'pizza', 'burger'],
    'Transportation': ['uber', 'ola', 'metro', 'petrol', 'diesel', 'cab', 'taxi', 'transport'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'shopping', 'clothing', 'fashion'],
    'Entertainment': ['netflix', 'prime', 'spotify', 'movie', 'cinema', 'subscription'],
    'Bills': ['electricity', 'water', 'mobile', 'recharge', 'bill'],
    'Healthcare': ['pharmacy', 'hospital', 'doctor', 'medical', 'medicine', 'health'],
    'Education': ['book', 'course', 'tuition', 'school', 'college', 'education'],
    'Rent': ['rent', 'flat', 'house'],
    'EMI': ['emi', 'loan']
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'Others';
};

/**
 * Get categorization suggestions for an expense
 * @param {String} userId - User ID
 * @param {String} merchant - Merchant name
 * @param {String} description - Transaction description
 * @returns {Promise<Object>} Suggestions
 */
const getCategorySuggestions = async (userId, merchant, description) => {
  try {
    const historicalCategory = await autoCategorizeExpense(userId, merchant, description);
    const keywordCategory = categorizeByKeywords(merchant, description);

    return {
      suggested: historicalCategory,
      alternative: historicalCategory !== keywordCategory ? keywordCategory : null,
      confidence: historicalCategory !== 'Others' ? 'high' : 'low'
    };
  } catch (error) {
    console.error('Error getting category suggestions:', error);
    return {
      suggested: 'Others',
      alternative: null,
      confidence: 'low'
    };
  }
};

module.exports = {
  fetchBankTransactions,
  importFromBank,
  autoCategorizeExpense,
  getCategorySuggestions
};
