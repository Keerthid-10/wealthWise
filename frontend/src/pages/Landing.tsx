import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="container">
          <h1 className="landing-title">Welcome to WealthWise</h1>
          <p className="landing-subtitle">Your Personal Finance Management Companion</p>
          <p className="landing-description">
            Take control of your finances with powerful tracking, budgeting, and analytics tools.
            Join thousands of users who are achieving their financial goals with WealthWise.
          </p>
          <div className="landing-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
              Get Started 
            </button>
            <button className="btn btn-outline-primary btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </div>

      <div className="landing-features">
        <div className="container">
          <h2 className="features-title">Everything You Need to Manage Your Money</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-wallet2"></i>
              </div>
              <h3>Expense Tracking</h3>
              <p>Easily track and categorize all your expenses. Import transactions from your bank automatically.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-cash-stack"></i>
              </div>
              <h3>Income Management</h3>
              <p>Monitor your income streams with automatic 10% savings on every income entry.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <h3>Budget Planner</h3>
              <p>Create monthly budgets with category breakdowns. Get alerts when you're close to your limits.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-piggy-bank"></i>
              </div>
              <h3>Smart Savings</h3>
              <p>Build your savings automatically with personalized advice and progress tracking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-bar-chart"></i>
              </div>
              <h3>Analytics & Reports</h3>
              <p>Visualize your spending patterns with interactive charts and detailed reports.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-people"></i>
              </div>
              <h3>Community Savings</h3>
              <p>Join savings groups with friends and family. Rotate payouts and achieve goals together.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-bell"></i>
              </div>
              <h3>Smart Reminders</h3>
              <p>Never miss a payment with automatic reminders for recurring expenses and goals.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3>Secure & Private</h3>
              <p>Your financial data is encrypted and secure. We never share your information.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-cta">
        <div className="container">
          <h2>Ready to Take Control of Your Finances?</h2>
          <p>Join WealthWise today and start your journey to financial freedom</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
            Create Your Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
