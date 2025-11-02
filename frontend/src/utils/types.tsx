export interface User {
  id: string;
  name: string;
  email: string;
  dob: string;
  phone?: string;
  currency: string;
}

export interface Expense {
  _id: string;
  amount: number;
  currency: string;
  category: string;
  merchant?: string;
  description?: string;
  date: string;
  paymentMethod: string;
  isRecurring: boolean;
}

export interface Income {
  _id: string;
  amount: number;
  currency: string;
  source: string;
  type: string;
  description?: string;
  date: string;
}

export interface Budget {
  _id: string;
  type: 'monthly' | 'weekly';
  totalAmount: number;
  currency: string;
  categoryBudgets: Array<{
    category: string;
    amount: number;
  }>;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface FinancialGoal {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  category: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  progress?: string;
}

export interface RecurringExpense {
  _id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  merchant?: string;
  description?: string;
  isActive: boolean;
}

export interface Savings {
  _id: string;
  initialAmount: number;
  currentAmount: number;
  currency: string;
  monthlyTarget: number;
  transactions: Array<{
    amount: number;
    type: 'deposit' | 'withdrawal';
    reason: string;
    date: string;
  }>;
}

export const CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'AED'
];

export const EXPENSE_CATEGORIES = [
  'Food', 'Transportation', 'Shopping', 'Entertainment',
  'Bills', 'Healthcare', 'Education', 'Rent', 'EMI', 'Others'
];

export const INCOME_TYPES = [
  'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Others'
];

export const PAYMENT_METHODS = [
  'Cash', 'Card', 'UPI', 'Net Banking', 'Others'
];

export const GOAL_CATEGORIES = [
  'Emergency Fund', 'Vacation', 'Car', 'House', 'Education', 'Retirement', 'Wedding', 'Others'
];
