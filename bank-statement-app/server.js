const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration - Fixed for proper preflight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);

    // Allow all origins (you can restrict this to specific origins if needed)
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Root route - Landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bank Statement Server</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          max-width: 600px;
          text-align: center;
        }
        h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .status {
          font-size: 1.2em;
          color: #4ade80;
          margin: 20px 0;
        }
        .info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        }
        .info h3 {
          margin-top: 0;
          color: #fbbf24;
        }
        .endpoint {
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          font-family: 'Courier New', monospace;
        }
        a {
          color: #60a5fa;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .account-info {
          margin-top: 20px;
          font-size: 0.9em;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏦 Bank Statement Server</h1>
        <div class="status">✅ Server is Running</div>

        <div class="info">
          <h3>Account Information</h3>
          <div class="account-info">
            <p><strong>Account Holder:</strong> ${bankData.accountHolder.name}</p>
            <p><strong>Account Number:</strong> ${bankData.accountHolder.accountNumber}</p>
            <p><strong>Statement Period:</strong> ${bankData.statementPeriod.from} to ${bankData.statementPeriod.to}</p>
            <p><strong>Closing Balance:</strong> ₹${bankData.balance.closingBalance.toFixed(2)}</p>
          </div>
        </div>

        <div class="info">
          <h3>Available API Endpoints</h3>
          <div class="endpoint">
            <strong>GET</strong> <a href="/api/bank/transactions" target="_blank">/api/bank/transactions</a>
            <br><small>View all transactions</small>
          </div>
          <div class="endpoint">
            <strong>GET</strong> <a href="/api/bank/transactions/export" target="_blank">/api/bank/transactions/export</a>
            <br><small>Export debit transactions for import</small>
          </div>
          <div class="endpoint">
            <strong>GET</strong> <a href="/health" target="_blank">/health</a>
            <br><small>Health check endpoint</small>
          </div>
        </div>

        <p style="margin-top: 30px; font-size: 0.9em; opacity: 0.7;">
          🔗 Connect this to WealthWise backend for automatic expense import
        </p>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bank API Server is running' });
});

// Start server on all interfaces for better compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`✅ Bank API Server is RUNNING`);
  console.log(`========================================`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Alt URL:    http://127.0.0.1:${PORT}`);
  console.log(``);
  console.log(`Account: ${bankData.accountHolder.name}`);
  console.log(`Number:  ${bankData.accountHolder.accountNumber}`);
  console.log(`Period:  ${bankData.statementPeriod.from} to ${bankData.statementPeriod.to}`);
  console.log(`Balance: ₹${bankData.balance.closingBalance.toFixed(2)}`);
  console.log(`========================================`);
  console.log(`Test health: http://localhost:${PORT}/health`);
  console.log(`========================================`);
});
