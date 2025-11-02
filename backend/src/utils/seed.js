require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const FinancialGoal = require('../models/FinancialGoal');
const RecurringExpense = require('../models/RecurringExpense');
const Savings = require('../models/Savings');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Expense.deleteMany({});
    await Income.deleteMany({});
    await Budget.deleteMany({});
    await FinancialGoal.deleteMany({});
    await RecurringExpense.deleteMany({});
    await Savings.deleteMany({});

    console.log('Cleared existing data');

    // Create test user
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'test@wealthwise.com',
      password: hashedPassword,
      dob: new Date('1995-05-15'),
      phone: '+91 9876543210',
      currency: 'INR'
    });

    console.log('Created test user:', user.email);

    // Create sample income
    const incomes = [
      {
        userId: user._id,
        amount: 75000,
        currency: 'INR',
        source: 'Salary',
        type: 'Salary',
        description: 'Monthly salary',
        date: new Date()
      },
      {
        userId: user._id,
        amount: 15000,
        currency: 'INR',
        source: 'Freelance Project',
        type: 'Freelance',
        description: 'Web development project',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    await Income.insertMany(incomes);
    console.log('Created sample income');

    // Create sample expenses
    const expenses = [
      {
        userId: user._id,
        amount: 25000,
        currency: 'INR',
        category: 'Rent',
        merchant: 'Property Owner',
        description: 'Monthly rent',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        paymentMethod: 'UPI'
      },
      {
        userId: user._id,
        amount: 3500,
        currency: 'INR',
        category: 'Food',
        merchant: 'D-Mart',
        description: 'Grocery shopping',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Card'
      },
      {
        userId: user._id,
        amount: 1200,
        currency: 'INR',
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Cab rides',
        date: new Date(),
        paymentMethod: 'UPI'
      },
      {
        userId: user._id,
        amount: 2500,
        currency: 'INR',
        category: 'Shopping',
        merchant: 'Amazon',
        description: 'Clothing',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Card'
      },
      {
        userId: user._id,
        amount: 800,
        currency: 'INR',
        category: 'Entertainment',
        merchant: 'Netflix',
        description: 'Subscription',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Card'
      }
    ];

    await Expense.insertMany(expenses);
    console.log('Created sample expenses');

    // Create sample budget
    const budget = await Budget.create({
      userId: user._id,
      type: 'monthly',
      totalAmount: 60000,
      currency: 'INR',
      categoryBudgets: [
        { category: 'Food', amount: 10000 },
        { category: 'Transportation', amount: 5000 },
        { category: 'Entertainment', amount: 3000 },
        { category: 'Shopping', amount: 8000 }
      ],
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      isActive: true
    });

    console.log('Created sample budget');

    // Create sample financial goal
    const goal = await FinancialGoal.create({
      userId: user._id,
      title: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 25000,
      currency: 'INR',
      category: 'Emergency Fund',
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      description: 'Build 6 months emergency fund',
      status: 'active'
    });

    console.log('Created sample financial goal');

    // Create sample recurring expense
    const recurring = await RecurringExpense.create({
      userId: user._id,
      title: 'Internet Bill',
      amount: 999,
      currency: 'INR',
      category: 'Bills',
      frequency: 'monthly',
      dayOfMonth: 5,
      merchant: 'Airtel',
      description: 'Monthly internet bill',
      startDate: new Date(),
      isActive: true
    });

    console.log('Created sample recurring expense');

    // Create savings account
    const savings = await Savings.create({
      userId: user._id,
      initialAmount: 50000,
      currentAmount: 50000,
      currency: 'INR',
      monthlyTarget: 10000,
      transactions: [
        {
          amount: 50000,
          type: 'deposit',
          reason: 'Initial savings',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    console.log('Created sample savings account');

    console.log('\n✅ Seed data created successfully!');
    console.log('\nTest User Credentials:');
    console.log('Email: test@wealthwise.com');
    console.log('Password: Test@123');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(seedData);
