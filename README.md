# WealthWise - Personal Finance Management App

A full-stack personal finance management application with expense tracking, budgeting, income tracking, and bank integration.

## Features

- 💰 Expense Management (Import from bank, Edit, Delete, Export)
- 📊 Budget Planning (Monthly/Weekly budgets)
- 💵 Income Tracking
- 🎯 Financial Goals
- 💎 Savings Account
- 🔄 Recurring Expenses
- 🏦 Bank Statement Integration
- 📈 Analytics & Reports
- 🔐 Secure Authentication with Password Reset

## Tech Stack

**Frontend:** React, TypeScript, Bootstrap
**Backend:** Node.js, Express, MongoDB
**Authentication:** JWT

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install

cd ../frontend
npm install

cd ../bank-statement-app
npm install
```

2. **Start MongoDB:**
Make sure MongoDB is running on `mongodb://localhost:27017`

3. **Start all servers:**

**Windows:**
```bash
start-all.bat
```

**Or manually (open 3 terminals):**
```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm start

# Terminal 2 - Bank API (port 3002)
cd bank-statement-app
npm start

# Terminal 3 - Frontend (port 3000)
cd frontend
npm start
```

4. **Open browser:**
```
http://localhost:3000
```

### Test Account
```
Email: test@wealthwise.com
Password: Test@123
```

## Configuration

### Backend (.env)
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wealthwise
JWT_SECRET=wealthwise_secret_key_change_in_production_2024
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BANK_API_URL=http://localhost:3002
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=WealthWise
REACT_APP_VERSION=1.0.0
```

### Bank API (.env)
```bash
PORT=3002
NODE_ENV=development
```

## Usage

1. **Sign Up** - Create a new account or use test account
2. **Import Expenses** - Go to Expenses → Click "Import Expenses from Bank"
3. **Track Income** - Add your income sources
4. **Set Budget** - Create monthly/weekly budgets
5. **View Reports** - Check analytics and spending patterns

## Project Structure

```
WealthWise/
├── backend/              # Express API server
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── controllers/ # Request handlers
│   └── server.js
├── frontend/            # React app
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── services/   # API calls
│   │   └── utils/      # Utilities
│   └── public/
├── bank-statement-app/  # Mock bank API
│   ├── server.js
│   └── bank-statement.json
└── start-all.bat       # Windows startup script
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/password-reset/request` - Request OTP
- `POST /api/auth/password-reset/confirm` - Reset password

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/export` - Export (CSV/JSON)

### Bank Integration
- `GET /api/bank/transactions` - Get bank transactions
- `POST /api/bank/import` - Import from bank

### Budget
- `GET /api/budgets` - Get budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/status` - Check budget status

### Income, Goals, Savings, etc.
See full API documentation in code comments.

## Deployment

For production deployment, update environment variables:

**Backend:**
```bash
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=generate-strong-secret
FRONTEND_URL=https://your-frontend-url
BANK_API_URL=https://your-bank-api-url
NODE_ENV=production
```

**Frontend:**
```bash
REACT_APP_API_URL=https://your-backend-api-url/api
```

## License

MIT
