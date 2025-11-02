const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Load bank statement data
const bankStatementPath = path.join(__dirname, 'bank-statement.json');
let bankData = JSON.parse(fs.readFileSync(bankStatementPath, 'utf8'));

// Track imported transaction IDs to prevent duplicates
const importedTransactions = new Set();

// GET /api/bank/transactions - Get all transactions
app.get('/api/bank/transactions', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        accountHolder: bankData.accountHolder,
        accountDetails: bankData.accountDetails,
        balance: bankData.balance,
        transactions: bankData.transactions,
        summary: bankData.summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// GET /api/bank/transactions/export - Get transactions for export (only debits)
app.get('/api/bank/transactions/export', (req, res) => {
  try {
    // Filter only debit transactions (expenses) and exclude opening balance
    const expenses = bankData.transactions.filter(t =>
      t.type === 'DEBIT' && t.description !== 'Opening Balance'
    );

    // Transform to WealthWise expense format with categorization
    const transformedExpenses = expenses.map(transaction => {
      const category = categorizeTransaction(transaction.description);

      return {
        bankTransactionId: transaction.referenceNumber,
        amount: transaction.debit,
        category: category,
        merchant: extractMerchant(transaction.description),
        description: transaction.description,
        date: transaction.date,
        paymentMethod: getPaymentMethod(transaction.referenceNumber),
        alreadyImported: importedTransactions.has(transaction.referenceNumber)
      };
    });

    res.json({
      success: true,
      data: transformedExpenses,
      count: transformedExpenses.length,
      newTransactions: transformedExpenses.filter(t => !t.alreadyImported).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting transactions',
      error: error.message
    });
  }
});

// POST /api/bank/transactions/mark-imported - Mark transactions as imported
app.post('/api/bank/transactions/mark-imported', (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. transactionIds array required.'
      });
    }

    transactionIds.forEach(id => importedTransactions.add(id));

    res.json({
      success: true,
      message: `${transactionIds.length} transactions marked as imported`,
      totalImported: importedTransactions.size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking transactions as imported',
      error: error.message
    });
  }
});

// Helper function to categorize transactions based on description
function categorizeTransaction(description) {
  const desc = description.toLowerCase();

  // Category mapping based on keywords
  const categoryMap = {
    'Food': ['grocery', 'restaurant', 'zomato', 'swiggy', 'food', 'saravana'],
    'Transportation': ['uber', 'ola', 'metro', 'petrol', 'diesel', 'cab', 'taxi', 'cmrl'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'nykaa', 'shopping', 'clothing', 'fashion', 'lifestyle', 'phoenix'],
    'Entertainment': ['netflix', 'prime', 'spotify', 'movie', 'cinema', 'subscription'],
    'Bills': ['electricity', 'water', 'mobile', 'recharge', 'bill', 'tneb', 'airtel'],
    'Healthcare': ['pharmacy', 'hospital', 'doctor', 'medical', 'medicine', 'apollo', 'insurance', 'health'],
    'Education': ['book', 'course', 'tuition', 'school', 'college', 'higginbothams'],
    'Rent': ['rent', 'flat', 'house'],
    'EMI': ['emi', 'loan'],
    'Others': ['atm', 'withdrawal', 'transfer', 'gym', 'salon', 'beauty', 'cosmetics', 'lakme', 'cult.fit']
  };

  // Find matching category
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }

  return 'Others';
}

// Helper function to extract merchant name
function extractMerchant(description) {
  // Remove common prefixes and extract merchant name
  const cleanDesc = description
    .replace(/^(Rent Payment - |Grocery - |Restaurant - |Transfer to |ATM Withdrawal - )/i, '')
    .split(' - ')[0]
    .trim();

  return cleanDesc || 'Unknown';
}

// Helper function to determine payment method from reference number
function getPaymentMethod(referenceNumber) {
  if (referenceNumber.startsWith('UPI')) return 'UPI';
  if (referenceNumber.startsWith('DC')) return 'Card';
  if (referenceNumber.startsWith('ATM')) return 'Cash';
  if (referenceNumber.startsWith('BILL')) return 'Net Banking';
  return 'Others';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bank API Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Bank API Server is running on http://localhost:${PORT}`);
  console.log(`Serving bank statement data for: ${bankData.accountHolder.name}`);
  console.log(`Account: ${bankData.accountDetails.statementNumber}`);
  console.log(`Period: ${bankData.statementPeriod.from} to ${bankData.statementPeriod.to}`);
});
