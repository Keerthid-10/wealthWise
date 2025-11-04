const axios = require('axios');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Savings = require('../models/Savings');

const BANK_SERVER_URL = process.env.BANK_API_URL || 'http://localhost:3001';

// Auto-categorize transaction based on description/merchant
const autoCategorizeTransaction = (description, merchant) => {
  const keywords = {
    'Food': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining'],
    'Transportation': ['uber', 'ola', 'transport', 'taxi', 'metro', 'ride'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'shopping', 'store'],
    'Entertainment': ['netflix', 'prime', 'hotstar', 'movie', 'entertainment', 'spotify'],
    'Bills': ['electricity', 'water', 'gas', 'bill', 'bescom', 'utility'],
    'Healthcare': ['hospital', 'pharmacy', 'doctor', 'medical', 'health'],
    'Education': ['school', 'college', 'course', 'book', 'education'],
    'Rent': ['rent', 'lease', 'housing'],
    'EMI': ['emi', 'loan', 'installment']
  };

  const desc = (description || '').toLowerCase();
  const merch = (merchant || '').toLowerCase();

  for (const [category, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (desc.includes(keyword) || merch.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Others'; // Default category
};

// Fetch transactions from bank server
const fetchBankTransactions = async () => {
  try {
    const response = await axios.get(`${BANK_SERVER_URL}/transactions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bank transactions:', error.message);
    throw new Error('Failed to fetch transactions from bank server');
  }
};

// Import transactions
const importTransactions = async (userId) => {
  try {
    // Fetch transactions from bank
    const bankTransactions = await fetchBankTransactions();

    if (!bankTransactions || bankTransactions.length === 0) {
      return {
        success: true,
        message: 'No transactions available from bank',
        imported: 0,
        duplicates: 0,
        expenses: [],
        incomes: []
      };
    }

    // Get existing transactions to avoid duplicates
    const existingExpenses = await Expense.find({
      userId,
      bankTransactionId: { $exists: true, $ne: null }
    }).select('bankTransactionId');

    const existingIncomes = await Income.find({
      userId,
      source: { $regex: /imported from bank/i }
    }).select('description date amount');

    const existingTransactionIds = new Set(
      existingExpenses.map(e => e.bankTransactionId)
    );

    // Filter out duplicates
    const newTransactions = bankTransactions.filter(
      t => !existingTransactionIds.has(t.transactionId || t.id)
    );

    if (newTransactions.length === 0) {
      return {
        success: true,
        message: 'No new transactions to import',
        imported: 0,
        duplicates: bankTransactions.length,
        expenses: [],
        incomes: []
      };
    }

    const importedExpenses = [];
    const importedIncomes = [];

    for (const transaction of newTransactions) {
      const transactionId = transaction.transactionId || transaction.id;

      if (transaction.type === 'debit') {
        // Import as expense
        const category = autoCategorizeTransaction(
          transaction.description,
          transaction.merchant
        );

        const expense = await Expense.create({
          userId,
          amount: transaction.amount,
          currency: transaction.currency || 'INR',
          category,
          merchant: transaction.merchant || 'Unknown',
          description: transaction.description || '',
          date: new Date(transaction.date),
          paymentMethod: 'Card',
          bankTransactionId: transactionId
        });

        importedExpenses.push(expense);
      } else if (transaction.type === 'credit') {
        // Import as income
        const income = await Income.create({
          userId,
          amount: transaction.amount,
          currency: transaction.currency || 'INR',
          source: transaction.merchant || transaction.description || 'Bank Credit',
          description: `Imported from bank: ${transaction.description}`,
          date: new Date(transaction.date),
          type: 'Others'
        });

        // Auto-save 10% to savings
        const savingsAmount = transaction.amount * 0.1;
        let savingsAccount = await Savings.findOne({ userId });

        if (!savingsAccount) {
          // Create new savings account if doesn't exist
          savingsAccount = await Savings.create({
            userId,
            initialAmount: savingsAmount,
            currentAmount: savingsAmount,
            currency: transaction.currency || 'INR',
            transactions: [{
              amount: savingsAmount,
              type: 'deposit',
              reason: `Auto-save (10%) from imported income: ${transaction.merchant || transaction.description}`,
              date: new Date()
            }]
          });
        } else {
          // Update existing savings account
          savingsAccount.currentAmount += savingsAmount;
          savingsAccount.transactions.push({
            amount: savingsAmount,
            type: 'deposit',
            reason: `Auto-save (10%) from imported income: ${transaction.merchant || transaction.description}`,
            date: new Date()
          });
          savingsAccount.updatedAt = new Date();
          await savingsAccount.save();
        }

        importedIncomes.push(income);
      }
    }

    return {
      success: true,
      message: `Successfully imported ${importedExpenses.length} expenses and ${importedIncomes.length} income transactions`,
      imported: importedExpenses.length + importedIncomes.length,
      duplicates: bankTransactions.length - newTransactions.length,
      expenses: importedExpenses,
      incomes: importedIncomes
    };
  } catch (error) {
    console.error('Error importing transactions:', error);
    throw error;
  }
};

// Get categorization suggestion
const getCategorizationSuggestion = (description, merchant) => {
  const suggestedCategory = autoCategorizeTransaction(description, merchant);
  return {
    suggestedCategory,
    confidence: suggestedCategory !== 'Others' ? 'high' : 'low'
  };
};

module.exports = {
  fetchBankTransactions,
  importTransactions,
  getCategorizationSuggestion
};
