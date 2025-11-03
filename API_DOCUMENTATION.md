# Wealthwise API Documentation

RESTful API documentation for the Wealthwise application.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The Wealthwise API uses JSON Web Tokens (JWT) for authentication. To authenticate, include the JWT token in the Authorization header of your requests.

Example:

```
Authorization: Bearer <your_token_here>
```

---

## Endpoints

### 1. User Management

#### 1.1 Register

- **URL:** `/auth/register`
- **Method:** POST
- **Description:** Allows users to sign up for an account on Wealthwise.
- **Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "currency": "USD"
}
```

- **Response:**

- 201 Created

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<JWT_token>",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "currency": "USD"
  }
}
```

- 400 Bad Request

```json
{
  "errors": ["Invalid request body"]
}
```

#### 1.2 Log In

- **URL:** `/auth/login`
- **Method:** POST
- **Description:** Allows users to log in to their Wealthwise account.
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Login successful",
  "token": "<JWT_token>",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "currency": "USD"
  }
}
```

- 400 Bad Request

```json
{
  "errors": ["Invalid credentials"]
}
```

#### 1.3 Get Profile

- **URL:** `/auth/profile`
- **Method:** GET
- **Description:** Retrieves the authenticated user's profile information.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "currency": "USD",
    "createdAt": "2024-05-01T00:00:00.000Z"
  }
}
```

- 404 Not Found

```json
{
  "errors": ["User not found"]
}
```

#### 1.4 Update Profile

- **URL:** `/auth/profile`
- **Method:** PUT
- **Description:** Updates the authenticated user's profile information.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "name": "John Smith",
  "currency": "EUR"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "name": "John Smith",
    "email": "user@example.com",
    "currency": "EUR"
  }
}
```

#### 1.5 Request Password Reset

- **URL:** `/auth/password-reset/request`
- **Method:** POST
- **Description:** Initiates password reset process by generating an OTP.
- **Request Body:**

```json
{
  "email": "user@example.com"
}
```

- **Response:**

- 200 OK

```json
{
  "message": "OTP generated successfully",
  "otp": "123456",
  "email": "user@example.com"
}
```

#### 1.6 Verify OTP

- **URL:** `/auth/password-reset/verify-otp`
- **Method:** POST
- **Description:** Verifies the OTP sent to user's email.
- **Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

#### 1.7 Reset Password

- **URL:** `/auth/password-reset/confirm`
- **Method:** POST
- **Description:** Resets user password using verified OTP.
- **Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 2. Expense Management

#### 2.1 Create Expense

- **URL:** `/expenses`
- **Method:** POST
- **Description:** Allows users to create a new expense entry manually.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 50,
  "category": "Food",
  "description": "Groceries",
  "date": "2024-05-01",
  "paymentMethod": "Credit Card",
  "merchant": "Walmart"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Expense created successfully",
  "expense": {
    "id": "expense_id",
    "amount": 50,
    "category": "Food",
    "description": "Groceries",
    "date": "2024-05-01T00:00:00.000Z"
  }
}
```

- 400 Bad Request

```json
{
  "errors": ["Invalid request body"]
}
```

#### 2.2 Import Expenses

- **URL:** `/expenses/import`
- **Method:** POST
- **Description:** Allows users to import multiple expenses at once.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "expenses": [
    {
      "amount": 50,
      "category": "Food",
      "description": "Groceries",
      "date": "2024-05-01"
    },
    {
      "amount": 30,
      "category": "Transportation",
      "description": "Gas",
      "date": "2024-05-02"
    }
  ]
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Expenses imported successfully",
  "count": 2
}
```

#### 2.3 Get All Expenses

- **URL:** `/expenses`
- **Method:** GET
- **Description:** Retrieves all expenses for the authenticated user with optional filters.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `category` (optional): Filter by category
  - `startDate` (optional): Start date for filtering
  - `endDate` (optional): End date for filtering
  - `limit` (optional): Number of records to return
  - `offset` (optional): Number of records to skip

- **Response:**

- 200 OK

```json
{
  "success": true,
  "expenses": [
    {
      "id": "expense_id",
      "amount": 50,
      "category": "Food",
      "description": "Groceries",
      "date": "2024-05-01T00:00:00.000Z",
      "merchant": "Walmart"
    }
  ],
  "total": 1
}
```

#### 2.4 Get Daily Summary

- **URL:** `/expenses/daily-summary`
- **Method:** GET
- **Description:** Retrieves daily expense summary for the authenticated user.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for summary (defaults to today)
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "summary": {
    "date": "2024-05-01",
    "totalExpenses": 150,
    "expenseCount": 5,
    "topCategory": "Food",
    "currency": "USD"
  }
}
```

#### 2.5 Get Expenses by Category

- **URL:** `/expenses/by-category`
- **Method:** GET
- **Description:** Retrieves expenses grouped by category for a date range.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `startDate` (required): Start date
  - `endDate` (required): End date
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "data": {
    "Food": 200,
    "Transportation": 150,
    "Shopping": 100
  },
  "total": 450
}
```

#### 2.6 Get Expenses by Merchant

- **URL:** `/expenses/by-merchant`
- **Method:** GET
- **Description:** Retrieves expenses grouped by merchant for a date range.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `startDate` (required): Start date
  - `endDate` (required): End date
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "data": {
    "Walmart": 150,
    "Amazon": 100,
    "Starbucks": 50
  }
}
```

#### 2.7 Get Historical Expenses

- **URL:** `/expenses/historical`
- **Method:** GET
- **Description:** Retrieves historical expense data for trends and analysis.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "data": {
    "monthly": [
      {
        "month": "2024-05",
        "total": 500
      }
    ],
    "yearly": [
      {
        "year": "2024",
        "total": 5000
      }
    ]
  }
}
```

#### 2.8 Update Expense

- **URL:** `/expenses/:id`
- **Method:** PUT
- **Description:** Updates an existing expense.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 60,
  "category": "Food",
  "description": "Groceries updated"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Expense updated successfully",
  "expense": {
    "id": "expense_id",
    "amount": 60,
    "category": "Food",
    "description": "Groceries updated"
  }
}
```

#### 2.9 Delete Expense

- **URL:** `/expenses/:id`
- **Method:** DELETE
- **Description:** Deletes an expense.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

---

### 3. Income Management

#### 3.1 Create Income

- **URL:** `/income`
- **Method:** POST
- **Description:** Allows users to add a new income entry.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 5000,
  "source": "Salary",
  "description": "Monthly salary",
  "date": "2024-05-01",
  "category": "Employment"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Income created successfully",
  "income": {
    "id": "income_id",
    "amount": 5000,
    "source": "Salary",
    "date": "2024-05-01T00:00:00.000Z"
  }
}
```

#### 3.2 Get All Income

- **URL:** `/income`
- **Method:** GET
- **Description:** Retrieves all income entries for the authenticated user.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `startDate` (optional): Start date for filtering
  - `endDate` (optional): End date for filtering
  - `source` (optional): Filter by source

- **Response:**

- 200 OK

```json
{
  "success": true,
  "income": [
    {
      "id": "income_id",
      "amount": 5000,
      "source": "Salary",
      "description": "Monthly salary",
      "date": "2024-05-01T00:00:00.000Z"
    }
  ],
  "total": 5000
}
```

#### 3.3 Get Income Insights

- **URL:** `/income/insights`
- **Method:** GET
- **Description:** Retrieves income insights and analytics.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for insights (defaults to current month)
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "insights": {
    "totalIncome": 5000,
    "averageIncome": 5000,
    "topSource": "Salary",
    "incomeBySource": {
      "Salary": 5000
    }
  }
}
```

#### 3.4 Update Income

- **URL:** `/income/:id`
- **Method:** PUT
- **Description:** Updates an existing income entry.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 5500,
  "description": "Updated salary"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Income updated successfully"
}
```

#### 3.5 Delete Income

- **URL:** `/income/:id`
- **Method:** DELETE
- **Description:** Deletes an income entry.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Income deleted successfully"
}
```

---

### 4. Budget Management

#### 4.1 Create Budget

- **URL:** `/budgets`
- **Method:** POST
- **Description:** Allows users to set budgets for different expense categories.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "category": "Food",
  "amount": 300,
  "period": "monthly",
  "startDate": "2024-05-01"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Budget created successfully",
  "budget": {
    "id": "budget_id",
    "category": "Food",
    "amount": 300,
    "period": "monthly"
  }
}
```

- 400 Bad Request

```json
{
  "errors": ["Invalid request body"]
}
```

#### 4.2 Get Active Budgets

- **URL:** `/budgets/active`
- **Method:** GET
- **Description:** Retrieves all active budgets for the authenticated user.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "budgets": [
    {
      "id": "budget_id",
      "category": "Food",
      "amount": 300,
      "spent": 150,
      "remaining": 150,
      "percentage": 50
    }
  ]
}
```

#### 4.3 Check Budget Status

- **URL:** `/budgets/status`
- **Method:** GET
- **Description:** Checks current budget status and alerts.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for status check (defaults to today)
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "status": {
    "totalBudget": 1000,
    "totalSpent": 600,
    "totalRemaining": 400,
    "alerts": [
      {
        "category": "Food",
        "message": "80% of budget used"
      }
    ]
  }
}
```

#### 4.4 Get All Budgets

- **URL:** `/budgets`
- **Method:** GET
- **Description:** Retrieves all budgets including inactive ones.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "budgets": [
    {
      "id": "budget_id",
      "category": "Food",
      "amount": 300,
      "period": "monthly",
      "active": true
    }
  ]
}
```

#### 4.5 Update Budget

- **URL:** `/budgets/:id`
- **Method:** PUT
- **Description:** Updates an existing budget.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 400,
  "active": true
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Budget updated successfully"
}
```

#### 4.6 Delete Budget

- **URL:** `/budgets/:id`
- **Method:** DELETE
- **Description:** Deletes a budget.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Budget deleted successfully"
}
```

---

### 5. Financial Goals

#### 5.1 Create Financial Goal

- **URL:** `/goals`
- **Method:** POST
- **Description:** Allows users to set financial goals and track their progress.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "name": "Save $1000 by end of year",
  "targetAmount": 1000,
  "currentAmount": 0,
  "deadline": "2024-12-31",
  "category": "Savings"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Goal created successfully",
  "goal": {
    "id": "goal_id",
    "name": "Save $1000 by end of year",
    "targetAmount": 1000,
    "currentAmount": 0,
    "progress": 0
  }
}
```

- 400 Bad Request

```json
{
  "errors": ["Invalid request body"]
}
```

#### 5.2 Get All Goals

- **URL:** `/goals`
- **Method:** GET
- **Description:** Retrieves all financial goals for the authenticated user.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `status` (optional): Filter by status (active, completed, expired)

- **Response:**

- 200 OK

```json
{
  "success": true,
  "goals": [
    {
      "id": "goal_id",
      "name": "Save $1000 by end of year",
      "targetAmount": 1000,
      "currentAmount": 500,
      "progress": 50,
      "status": "active"
    }
  ]
}
```

#### 5.3 Update Goal Progress

- **URL:** `/goals/:id/progress`
- **Method:** PUT
- **Description:** Updates progress towards a financial goal.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 100
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Goal progress updated successfully",
  "goal": {
    "currentAmount": 600,
    "progress": 60
  }
}
```

#### 5.4 Update Goal

- **URL:** `/goals/:id`
- **Method:** PUT
- **Description:** Updates goal details.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "name": "Save $1500 by end of year",
  "targetAmount": 1500
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Goal updated successfully"
}
```

#### 5.5 Delete Goal

- **URL:** `/goals/:id`
- **Method:** DELETE
- **Description:** Deletes a financial goal.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

---

### 6. Recurring Expenses

#### 6.1 Create Recurring Expense

- **URL:** `/recurring-expenses`
- **Method:** POST
- **Description:** Creates a recurring expense that will be automatically processed.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 50,
  "category": "Utilities",
  "description": "Internet bill",
  "frequency": "monthly",
  "startDate": "2024-05-01",
  "dayOfMonth": 1
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Recurring expense created successfully",
  "recurringExpense": {
    "id": "recurring_id",
    "amount": 50,
    "category": "Utilities",
    "frequency": "monthly"
  }
}
```

#### 6.2 Get All Recurring Expenses

- **URL:** `/recurring-expenses`
- **Method:** GET
- **Description:** Retrieves all recurring expenses.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "recurringExpenses": [
    {
      "id": "recurring_id",
      "amount": 50,
      "category": "Utilities",
      "description": "Internet bill",
      "frequency": "monthly",
      "active": true
    }
  ]
}
```

#### 6.3 Process Recurring Expenses

- **URL:** `/recurring-expenses/process`
- **Method:** POST
- **Description:** Manually triggers processing of recurring expenses for a given date.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "date": "2024-05-01"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Processed 3 recurring expenses",
  "count": 3
}
```

#### 6.4 Update Recurring Expense

- **URL:** `/recurring-expenses/:id`
- **Method:** PUT
- **Description:** Updates a recurring expense.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 60,
  "active": true
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Recurring expense updated successfully"
}
```

#### 6.5 Delete Recurring Expense

- **URL:** `/recurring-expenses/:id`
- **Method:** DELETE
- **Description:** Deletes a recurring expense.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Recurring expense deleted successfully"
}
```

---

### 7. Savings Account

#### 7.1 Get Savings Account

- **URL:** `/savings`
- **Method:** GET
- **Description:** Retrieves the user's savings account information.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "savings": {
    "balance": 1000,
    "totalDeposits": 5000,
    "totalWithdrawals": 4000,
    "transactions": [
      {
        "type": "deposit",
        "amount": 100,
        "date": "2024-05-01",
        "reason": "Monthly savings"
      }
    ]
  }
}
```

#### 7.2 Deposit to Savings

- **URL:** `/savings/deposit`
- **Method:** POST
- **Description:** Deposits money into the savings account.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 100,
  "reason": "Monthly savings"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Deposit successful",
  "newBalance": 1100
}
```

#### 7.3 Withdraw from Savings

- **URL:** `/savings/withdraw`
- **Method:** POST
- **Description:** Withdraws money from the savings account.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "amount": 50,
  "reason": "Emergency expense"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Withdrawal successful",
  "newBalance": 1050
}
```

#### 7.4 Review Monthly Savings

- **URL:** `/savings/review`
- **Method:** GET
- **Description:** Reviews monthly savings performance.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for review (defaults to current month)

- **Response:**

- 200 OK

```json
{
  "success": true,
  "review": {
    "month": "2024-05",
    "deposited": 500,
    "withdrawn": 100,
    "netSavings": 400,
    "savingsRate": 0.08
  }
}
```

#### 7.5 Get Savings Summary

- **URL:** `/savings/summary`
- **Method:** GET
- **Description:** Retrieves overall savings summary.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "summary": {
    "currentBalance": 1050,
    "totalDeposits": 5100,
    "totalWithdrawals": 4050,
    "averageMonthlySavings": 400
  }
}
```

#### 7.6 Restore All Budget Withdrawals

- **URL:** `/savings/restore-all`
- **Method:** POST
- **Description:** Restores all budget withdrawals from savings.
- **Headers:** Authorization: Bearer <token>
- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "All budget withdrawals restored",
  "amountRestored": 500
}
```

---

### 8. Analytics & Dashboard

#### 8.1 Get Weekly Summary

- **URL:** `/analytics/weekly-summary`
- **Method:** GET
- **Description:** Retrieves weekly spending summary.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date within the week (defaults to current week)
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "summary": {
    "week": "2024-W18",
    "totalSpent": 350,
    "dailyAverage": 50,
    "topCategory": "Food",
    "comparison": {
      "previousWeek": 400,
      "change": -12.5
    }
  }
}
```

#### 8.2 Get Spending Patterns

- **URL:** `/analytics/patterns`
- **Method:** GET
- **Description:** Analyzes spending patterns over a date range.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `startDate` (required): Start date for analysis
  - `endDate` (required): End date for analysis
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "patterns": {
    "dailyAverage": 45,
    "weekdayVsWeekend": {
      "weekday": 40,
      "weekend": 60
    },
    "peakSpendingDay": "Saturday",
    "topCategories": ["Food", "Transportation", "Entertainment"]
  }
}
```

#### 8.3 Get Financial Insights

- **URL:** `/analytics/insights`
- **Method:** GET
- **Description:** Provides AI-generated financial insights and recommendations.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for insights (defaults to current month)
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "insights": {
    "spendingTrend": "increasing",
    "budgetHealth": "good",
    "recommendations": [
      "Consider reducing spending on Entertainment",
      "You're on track to meet your savings goal"
    ],
    "alerts": []
  }
}
```

#### 8.4 Get Dashboard Data

- **URL:** `/analytics/dashboard`
- **Method:** GET
- **Description:** Retrieves comprehensive dashboard data including expenses, income, budgets, and goals.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for dashboard (defaults to current month)
  - `currency` (optional): Currency for conversion

- **Response:**

- 200 OK

```json
{
  "success": true,
  "dashboard": {
    "totalIncome": 5000,
    "totalExpenses": 3500,
    "netSavings": 1500,
    "budgetStatus": {
      "totalBudget": 4000,
      "spent": 3500,
      "remaining": 500
    },
    "topExpenseCategories": {
      "Food": 800,
      "Transportation": 600,
      "Housing": 1200
    },
    "goalsProgress": [
      {
        "name": "Emergency Fund",
        "progress": 65,
        "status": "on_track"
      }
    ]
  }
}
```

---

### 9. Export

#### 9.1 Export Expenses

- **URL:** `/expenses/export`
- **Method:** POST
- **Description:** Exports expense data to Excel or PDF formats.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "format": "excel",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

- **Response:**

- 200 OK
  - Returns Excel (.xlsx) or PDF file download
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (for Excel)
  - Content-Type: application/pdf (for PDF)
  - Content-Disposition: attachment; filename="expenses_YYYY-MM-DD.xlsx"

- 400 Bad Request

```json
{
  "errors": ["Invalid date range"]
}
```

---

### 10. Reminders & Notifications

#### 10.1 Get Reminders

- **URL:** `/reminders`
- **Method:** GET
- **Description:** Retrieves reminders for bills, budget alerts, and goal deadlines.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `date` (optional): Date for reminders (defaults to today)

- **Response:**

- 200 OK

```json
{
  "success": true,
  "reminders": [
    {
      "type": "bill",
      "message": "Internet bill due tomorrow",
      "amount": 50,
      "dueDate": "2024-05-02"
    },
    {
      "type": "budget",
      "message": "80% of Food budget used",
      "category": "Food"
    },
    {
      "type": "goal",
      "message": "Goal deadline approaching in 30 days",
      "goalName": "Save $1000 by end of year"
    }
  ]
}
```

---

### 11. Bank Integration

#### 11.1 Get Bank Transactions

- **URL:** `/bank/transactions`
- **Method:** GET
- **Description:** Retrieves transactions from connected bank accounts.
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `startDate` (optional): Start date for transactions
  - `endDate` (optional): End date for transactions
  - `accountId` (optional): Filter by specific account

- **Response:**

- 200 OK

```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_id",
      "date": "2024-05-01",
      "description": "Walmart Purchase",
      "amount": -50,
      "merchant": "Walmart",
      "category": "Shopping",
      "accountId": "account_123"
    }
  ]
}
```

#### 11.2 Import from Bank

- **URL:** `/bank/import`
- **Method:** POST
- **Description:** Imports transactions from bank to expenses.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "accountId": "account_123",
  "transactionIds": ["txn_1", "txn_2", "txn_3"],
  "startDate": "2024-05-01",
  "endDate": "2024-05-31"
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "message": "Transactions imported successfully",
  "imported": 3,
  "expenses": [
    {
      "id": "expense_id",
      "amount": 50,
      "description": "Walmart Purchase"
    }
  ]
}
```

#### 11.3 Get Category Suggestion

- **URL:** `/bank/categorize-suggestion`
- **Method:** POST
- **Description:** Gets AI-powered category suggestions for bank transactions.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**

```json
{
  "description": "Walmart Purchase",
  "merchant": "Walmart",
  "amount": 50
}
```

- **Response:**

- 200 OK

```json
{
  "success": true,
  "suggestedCategory": "Groceries",
  "confidence": 0.95,
  "alternatives": ["Shopping", "Food"]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "message": "Unauthorized access"
}
```

### 500 Internal Server Error

```json
{
  "message": "Server error"
}
```

### 404 Not Found

```json
{
  "message": "Route not found"
}
```

---

## Health Check

#### Check API Health

- **URL:** `/health`
- **Method:** GET
- **Description:** Checks if the API is running.
- **Response:**

- 200 OK

```json
{
  "status": "OK",
  "timestamp": "2024-05-01T12:00:00.000Z"
}
```

---

## Notes

1. All date fields should be in ISO 8601 format (YYYY-MM-DD or full ISO datetime string).
2. Currency codes should follow ISO 4217 standard (e.g., USD, EUR, GBP, INR).
3. All monetary amounts are in the user's default currency unless otherwise specified.
4. Authentication tokens expire after a certain period and need to be refreshed.
5. Rate limiting may apply to certain endpoints to prevent abuse.
6. All endpoints support multi-currency conversion based on user preferences.

---

**Version:** 1.0.4
**Last Updated:** 2025-01-03
**Base URL:** http://localhost:5000/api
**Default Port:** 5000
