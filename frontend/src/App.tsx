import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OTPDisplay from './pages/OTPDisplay';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ImportExpenses from './pages/ImportExpenses';
import BudgetPlanner from './pages/BudgetPlanner';
import FinancialGoals from './pages/FinancialGoals';
import IncomeTracking from './pages/IncomeTracking';
import RecurringExpenses from './pages/RecurringExpenses';
import Savings from './pages/Savings';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import './styles/Theme.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ForgotPassword />} />
          {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
          <Route path="/otp-display" element={<OTPDisplay />} />

          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/import-expenses" element={<ProtectedRoute><ImportExpenses /></ProtectedRoute>} />
          <Route path="/budget-planner" element={<ProtectedRoute><BudgetPlanner /></ProtectedRoute>} />
          <Route path="/financial-goals" element={<ProtectedRoute><FinancialGoals /></ProtectedRoute>} />
          <Route path="/income-tracking" element={<ProtectedRoute><IncomeTracking /></ProtectedRoute>} />
          <Route path="/recurring-expenses" element={<ProtectedRoute><RecurringExpenses /></ProtectedRoute>} />
          <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
