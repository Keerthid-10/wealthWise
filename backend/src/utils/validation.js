// Manual validation functions

const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
};

const isValidDate = (date) => {
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

const isPositiveNumber = (num) => {
  return typeof num === 'number' && num > 0;
};

const isNotEmpty = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

const validateUserSignup = (data) => {
  const errors = [];

  if (!isNotEmpty(data.name)) {
    errors.push('Name is required');
  }

  if (!isEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!isStrongPassword(data.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  if (!isValidDate(data.dob)) {
    errors.push('Valid date of birth is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const errors = [];

  if (!isEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!isNotEmpty(data.password)) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateExpense = (data) => {
  const errors = [];

  if (!isPositiveNumber(data.amount)) {
    errors.push('Amount must be a positive number');
  }

  if (!isNotEmpty(data.category)) {
    errors.push('Category is required');
  }

  if (!isValidDate(data.date)) {
    errors.push('Valid date is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateIncome = (data) => {
  const errors = [];

  if (!isPositiveNumber(data.amount)) {
    errors.push('Amount must be a positive number');
  }

  if (!isNotEmpty(data.source)) {
    errors.push('Source is required');
  }

  if (!isValidDate(data.date)) {
    errors.push('Valid date is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBudget = (data) => {
  const errors = [];

  if (!isPositiveNumber(data.totalAmount)) {
    errors.push('Total amount must be a positive number');
  }

  if (!['monthly', 'weekly'].includes(data.type)) {
    errors.push('Type must be monthly or weekly');
  }

  if (!isValidDate(data.startDate) || !isValidDate(data.endDate)) {
    errors.push('Valid start and end dates are required');
  }

  // Validate category budgets if provided
  if (data.categoryBudgets && Array.isArray(data.categoryBudgets) && data.categoryBudgets.length > 0) {
    let categoryBudgetsSum = 0;

    for (const catBudget of data.categoryBudgets) {
      if (!catBudget.category || !isNotEmpty(catBudget.category)) {
        errors.push('Category name is required for all category budgets');
        break;
      }
      if (!isPositiveNumber(catBudget.amount)) {
        errors.push(`Category budget amount must be a positive number for ${catBudget.category}`);
        break;
      }
      categoryBudgetsSum += catBudget.amount;
    }

    // Check if sum of category budgets exceeds total budget
    if (categoryBudgetsSum > data.totalAmount) {
      errors.push(`Sum of category budgets (${categoryBudgetsSum.toFixed(2)}) cannot exceed total budget (${data.totalAmount.toFixed(2)})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateFinancialGoal = (data) => {
  const errors = [];

  if (!isNotEmpty(data.title)) {
    errors.push('Title is required');
  }

  if (!isPositiveNumber(data.targetAmount)) {
    errors.push('Target amount must be a positive number');
  }

  if (!isValidDate(data.startDate) || !isValidDate(data.endDate)) {
    errors.push('Valid start and end dates are required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isEmail,
  isStrongPassword,
  isValidDate,
  isPositiveNumber,
  isNotEmpty,
  validateUserSignup,
  validateLogin,
  validateExpense,
  validateIncome,
  validateBudget,
  validateFinancialGoal
};
