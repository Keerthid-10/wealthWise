# 💰 WealthWise - Personal Finance Management

> **Production-Ready** personal finance management application with community savings features.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-success.svg)

A comprehensive full-stack personal finance management application with expense tracking, budgeting, income management, community savings, and bank integration.

---

## ✨ Features

### Core Features
- 💰 **Expense Management** - Track, import, categorize, edit, and export expenses
- 📊 **Budget Planning** - Create monthly budgets with category breakdowns
- 💵 **Income Tracking** - Track income with automatic 10% savings
- 🎯 **Financial Goals** - Set and track progress toward financial goals
- 💎 **Savings Account** - Automated savings with transaction history
- 🔄 **Recurring Expenses** - Automate tracking of regular expenses
- 🏦 **Bank Integration** - Import transactions from bank statements
- 📈 **Analytics & Reports** - Visual charts and detailed spending analysis
- 🔐 **Secure Authentication** - JWT-based auth with password reset via OTP

### 🎉 NEW: Community Savings Pot
- 👥 **Create Private Groups** - Save together with friends and family
- 📧 **Email Invitations** - Add registered users by email
- 💰 **Fixed Contributions** - Monthly contribution tracking
- 🔄 **Rotation Payouts** - Each member receives the pot once
- ⚖️ **Penalty System** - Late payment penalties with grace periods
- 📋 **Auto-Ledger** - Complete transaction history
- 🔒 **Secure Payouts** - Creator-controlled payout processing
- ✅ **Auto-Completion** - Group closes when all members receive payout

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running on `mongodb://localhost:27017`)
- npm or yarn

### Installation

**1. Install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Bank API
cd ../bank-statement-app
npm install
```

**2. Configure environment variables:**

Backend `.env` (already configured):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wealthwise
JWT_SECRET=wealthwise_secret_key_change_in_production_2025
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BANK_API_URL=http://localhost:3001
```

**3. Start all services** (open 4 terminals):

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend (port 5000):**
```bash
cd backend
npm start
```

**Terminal 3 - Bank API (port 3001):**
```bash
cd bank-statement-app
npm start
```

**Terminal 4 - Frontend (port 3000):**
```bash
cd frontend
npm start
```

**4. Open browser:**
```
http://localhost:3000
```

---

## 🎯 User Guide

### First Time Setup
1. Visit `http://localhost:3000`
2. See professional landing page
3. Click **"Get Started Free"** or **"Sign Up"**
4. Register with name, email, password, and preferred currency
5. Login and explore features

### Using the Application

#### Importing Bank Transactions
1. Navigate to **Expenses** page
2. Click **"Import from Bank"**
3. System automatically:
   - Categorizes debit transactions as expenses
   - Creates income entries for credit transactions
   - Auto-saves 10% of income to your savings account

#### Creating a Budget
1. Navigate to **Budget Planner**
2. Enter total monthly budget amount
3. (Optional) Add category-specific budgets
4. System validates that category sum ≤ total budget
5. Track spending vs budget in real-time
6. Get alerts when approaching or exceeding limits

#### Managing Community Savings
1. Click **Expenses** in navbar
2. Click **Community** button (appears when on Expenses page)
3. Click **"Create New Group"**
4. Fill in group details:
   - Group name and description
   - Monthly contribution amount
   - Number of members (cycles)
   - Payout method (rotation or voting)
   - Penalty percentage and grace period
5. Add members by entering their registered email addresses
6. Members contribute monthly
7. Creator processes payouts each cycle
8. View complete transaction ledger

---

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0 with **TypeScript**
- **React Router DOM** 6.22.0 for routing
- **Axios** for API integration
- **Recharts** 2.12.0 for data visualization
- **Bootstrap** 5.3.2 + Bootstrap Icons
- **Responsive Design** - Mobile, tablet, and desktop

### Backend
- **Node.js** with **Express** 4.18.2
- **MongoDB** with **Mongoose** 8.1.1
- **JWT** (jsonwebtoken 9.0.2) for authentication
- **bcryptjs** 2.4.3 for password hashing
- **Axios** 1.6.7 for external API calls
- **ExcelJS** 4.4.0 & **PDFKit** 0.15.0 for exports

### Mock Services
- **JSON Server** 0.17.4 for bank API simulation

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/password-reset/*` - Password reset flow

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get all expenses (with filters)
- `POST /api/expenses/import` - Bulk import
- `GET /api/expenses/by-category` - Category breakdown
- `GET /api/expenses/by-merchant` - Merchant breakdown
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/export` - Export to Excel/PDF

### Income
- `POST /api/income` - Create income (auto-saves 10%)
- `GET /api/income` - Get all income
- `PUT /api/income/:id` - Update income
- `DELETE /api/income/:id` - Delete income

### Budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/active` - Get active budget
- `GET /api/budgets/status` - Check budget status
- `GET /api/budgets` - Get all budgets
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Community Savings (NEW)
- `POST /api/community-savings` - Create group
- `GET /api/community-savings` - Get all user groups
- `GET /api/community-savings/:id` - Get group details
- `POST /api/community-savings/:id/members` - Add member
- `POST /api/community-savings/:id/contribute` - Make contribution
- `POST /api/community-savings/:id/payout` - Process payout
- `GET /api/community-savings/:id/ledger` - View transaction ledger
- `PUT /api/community-savings/:id` - Update group settings
- `DELETE /api/community-savings/:id` - Delete group

### Bank Integration
- `GET /api/bank/transactions` - Get bank transactions
- `POST /api/bank/import` - Import from bank

### Analytics
- `GET /api/analytics/dashboard` - Dashboard summary
- `GET /api/analytics/patterns` - Spending patterns
- `GET /api/analytics/insights` - Financial insights

*[See PRODUCTION_READY.md for complete API documentation]*

---

## 📂 Project Structure

```
WealthWise/
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable components (Navbar, etc.)
│   │   ├── pages/         # Page components
│   │   │   ├── Landing.tsx                    # NEW: Landing page
│   │   │   ├── CommunitySavings.tsx           # NEW: Community groups list
│   │   │   ├── CommunitySavingsDetail.tsx     # NEW: Group details
│   │   │   ├── CommunitySavingsCreate.tsx     # NEW: Create group
│   │   │   └── ... (other pages)
│   │   ├── services/      # API integration
│   │   ├── styles/        # CSS files
│   │   │   ├── Theme.css                      # Design system
│   │   │   ├── Landing.css                    # NEW
│   │   │   ├── CommunitySavings.css           # NEW
│   │   │   └── ...
│   │   └── utils/         # Utilities, types, helpers
│   │       ├── types.tsx                      # TypeScript interfaces
│   │       ├── helpers.ts                     # NEW: Helper functions
│   │       └── AuthContext.tsx                # Auth context
│   └── package.json
│
├── backend/               # Node.js Express backend
│   ├── src/
│   │   ├── models/       # MongoDB models
│   │   │   ├── CommunitySavingsPot.js         # NEW: Community savings model
│   │   │   └── ... (other models)
│   │   ├── controllers/  # Route controllers
│   │   │   ├── communitySavingsController.js  # NEW: Community controller
│   │   │   └── ...
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth middleware
│   │   └── utils/        # Utilities
│   └── package.json
│
├── bank-statement-app/    # Mock bank API (JSON Server)
│   ├── db.json           # Sample transactions
│   └── package.json
│
├── README.md             # This file
└── PRODUCTION_READY.md   # Detailed production documentation
```

---

## 🎨 Design System

### Color Palette
```css
Primary:    Deep Navy      #0A1A44
Secondary:  Soft Cyan      #3EC1D3
Accent:     Soft Lime      #8FF7A7
Background: Off-White      #F8F8F8
Text:       Charcoal Gray  #222831
Supporting: Gray           #A8A8A8
```

### Typography
- **Font Family**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Headings**: 600-700 weight
- **Body Text**: 400-500 weight

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Protected API endpoints
- ✅ Session management
- ✅ XSS protection
- ✅ Input validation
- ✅ Secure password reset with OTP

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Import bank transactions
- [ ] Create and track expenses
- [ ] Add income (verify 10% auto-save)
- [ ] Create monthly budget
- [ ] Set financial goals
- [ ] Create community savings group
- [ ] Add members and make contributions
- [ ] Process payouts
- [ ] View dashboard analytics
- [ ] Generate and export reports

---

## 🐛 Troubleshooting

### Frontend won't start
- Ensure Node.js v14+ is installed
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules package-lock.json && npm install`

### Backend errors
- Verify MongoDB is running: `mongod`
- Check port 5000 is available
- Ensure `.env` file exists with correct configuration

### Bank import not working
- Verify JSON server is running on port 3001
- Check backend `.env` has `BANK_API_URL=http://localhost:3001`
- Ensure `db.json` exists in `bank-statement-app/`

### TypeScript errors
- Run `npm run build` to check compilation
- Ensure all dependencies are installed
- Check for version compatibility

---

## 📦 Deployment

### Production Checklist

**Backend:**
```bash
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=generate-strong-random-secret-here
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

**Frontend:**
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

**Additional Steps:**
- [ ] Enable HTTPS
- [ ] Set up CORS whitelist
- [ ] Implement rate limiting
- [ ] Configure database backups
- [ ] Set up error logging (e.g., Sentry)
- [ ] Enable gzip compression
- [ ] Optimize bundle size
- [ ] Set up CDN for static assets

---

## 📄 Documentation

- **PRODUCTION_READY.md** - Comprehensive production guide
  - Complete feature list
  - API documentation
  - Database schema
  - User flows
  - Deployment guide

---

## 🎉 Version History

### v2.0.0 (2025-01-04) - Production Ready ✨
- ✅ Complete UI/UX redesign with new color palette
- ✅ Community Savings Pot feature (fully implemented)
- ✅ Professional landing page
- ✅ Redesigned conditional navigation
- ✅ Fixed bank import and auto-categorization
- ✅ Budget validation improvements
- ✅ Decoupled budget from savings
- ✅ Helper utilities and TypeScript fixes
- ✅ Production-ready with full documentation

### v1.0.4 (Previous)
- Basic features: Dashboard, Expenses, Budget, Savings
- Bank integration with JSON server
- Authentication and profile management

---

## 📞 Support

For issues or questions:
1. Check browser console for frontend errors (F12)
2. Check backend terminal for API errors
3. Verify all 4 services are running
4. Review `PRODUCTION_READY.md` for detailed documentation
5. Check this README for common troubleshooting

---

## 📝 License

This project is for personal and educational use.

---

## 🌟 Quick Commands

```bash
# Start everything (in separate terminals)
mongod                                    # Terminal 1
cd backend && npm start                   # Terminal 2
cd bank-statement-app && npm start        # Terminal 3
cd frontend && npm start                  # Terminal 4

# Access application
http://localhost:3000
```

---

**Built with ❤️ for better financial management**

**Status**: ✅ **PRODUCTION READY** 🚀
