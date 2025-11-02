import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { analyticsAPI, remindersAPI } from '../services/api';
import '../styles/Theme.css';

interface FeatureCard {
  title: string;
  description: string;
  path: string;
  icon: string;
  requiresAuth: boolean;
}

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);

  const featureCards: FeatureCard[] = [
    {
      title: 'View Dashboard',
      description: 'See your financial overview with charts and insights',
      path: '/dashboard',
      icon: 'bi-speedometer2',
      requiresAuth: true
    },
    {
      title: 'Expenses',
      description: 'Manage, import and export your expenses',
      path: '/expenses',
      icon: 'bi-receipt',
      requiresAuth: true
    },
    {
      title: 'Track Income',
      description: 'Record and track your income sources',
      path: '/income-tracking',
      icon: 'bi-cash-stack',
      requiresAuth: true
    },
    {
      title: 'Budget Planner',
      description: 'Set and manage your monthly or weekly budgets',
      path: '/budget-planner',
      icon: 'bi-wallet2',
      requiresAuth: true
    },
    {
      title: 'Reports',
      description: 'View detailed spending reports and analytics',
      path: '/reports',
      icon: 'bi-graph-up',
      requiresAuth: true
    },
    {
      title: 'Financial Goals',
      description: 'Set and track your financial goals',
      path: '/financial-goals',
      icon: 'bi-trophy',
      requiresAuth: true
    },
    {
      title: 'Recurring Expenses',
      description: 'Manage your recurring expenses like rent, EMI, etc.',
      path: '/recurring-expenses',
      icon: 'bi-arrow-repeat',
      requiresAuth: true
    },
    {
      title: 'Savings',
      description: 'Track and manage your savings',
      path: '/savings',
      icon: 'bi-piggy-bank',
      requiresAuth: true
    }
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      checkWeeklySummary();
      fetchReminders();
    }
  }, [isAuthenticated, user]);

  const fetchReminders = async () => {
    try {
      const response = await remindersAPI.getReminders();
      setReminders(response.data.reminders || []);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
  };

  const checkWeeklySummary = async () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Show weekly summary on weekends (Saturday=6, Sunday=0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      try {
        const response = await analyticsAPI.getWeeklySummary(
          today.toISOString(),
          user?.currency
        );
        setWeeklySummary(response.data.summary);
        setShowWeeklySummary(true);
      } catch (error) {
        console.error('Failed to fetch weekly summary:', error);
      }
    }
  };

  const handleCardClick = (card: FeatureCard) => {
    if (card.requiresAuth && !isAuthenticated) {
      alert('Please login to access this feature');
      navigate('/login');
      return;
    }
    navigate(card.path);
  };

  return (
    <div className="home-container">
      <div className="container mt-4">
        <div className="card mb-4">
          <div className="card-header">
            <h1>Welcome to WealthWise</h1>
            <p>Your personal finance management companion</p>
          </div>
        </div>

        {/* Reminders Section */}
        {isAuthenticated && reminders.length > 0 && (
          <div className="card mb-4">
            <div className="card-body">
              <h4>Reminders</h4>
              {reminders.map((reminder, index) => {
                const alertClass = reminder.priority === 'urgent'
                  ? 'alert-danger'
                  : reminder.priority === 'high'
                  ? 'alert-warning'
                  : reminder.priority === 'medium'
                  ? 'alert-info'
                  : 'alert-secondary';

                return (
                  <div key={index} className={`alert ${alertClass} mb-2`}>
                    <strong>{reminder.type === 'recurring_expense' ? '💳' : reminder.type === 'financial_goal' ? '' : ''}</strong> {reminder.message}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Summary Section */}
        {showWeeklySummary && weeklySummary && (
          <div className="card mb-4">
            <div className="card-body" style={{background: 'linear-gradient(135deg, #e6dff2 0%, #c4a8d8 100%)'}}>
              <h4>📊 Weekly Summary</h4>
              <div className="mt-3">
                {weeklySummary.insights && weeklySummary.insights.map((insight: string, index: number) => (
                  <p key={index} className="mb-2"><strong>• {insight}</strong></p>
                ))}
                {weeklySummary.topCategories && weeklySummary.topCategories.length > 0 && (
                  <div className="mt-3">
                    <strong>Top 3 Spending Categories This Week:</strong>
                    <div className="row mt-2">
                      {weeklySummary.topCategories.map((cat: any, index: number) => (
                        <div key={index} className="col-md-4 mb-2">
                          <div className="card text-center">
                            <div className="card-body">
                              <h6>{cat.category}</h6>
                              <h5>₹{cat.amount.toFixed(2)}</h5>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="row g-3">
          {featureCards.map((card, index) => (
            <div key={index} className="col-md-6 col-lg-4 col-xl-3">
              <div
                className={`card h-100 ${!isAuthenticated && card.requiresAuth ? 'opacity-50' : ''}`}
                onClick={() => handleCardClick(card)}
                style={{cursor: 'pointer'}}
              >
                <div className="card-body text-center d-flex flex-column">
                  <div style={{fontSize: '48px', color: '#9b7bbf'}}>
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <h5 className="mt-3">{card.title}</h5>
                  <p className="text-muted flex-grow-1">{card.description}</p>
                  {!isAuthenticated && card.requiresAuth && (
                    <span className="badge badge-warning mt-auto">Login Required</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
