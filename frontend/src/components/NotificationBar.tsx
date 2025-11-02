import React, { useState, useEffect } from 'react';
import { budgetAPI, goalsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const NotificationBar: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const getCurrencySymbol = (currency: string = 'INR') => {
    const symbols: any = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'CNY': '¥',
      'AED': 'AED'
    };
    return symbols[currency] || currency;
  };

  const currencySymbol = getCurrencySymbol(user?.currency);

  useEffect(() => {
    checkForAlerts();
    const interval = setInterval(checkForAlerts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkForAlerts = async () => {
    try {
      const [budgetResponse, goalsResponse] = await Promise.all([
        budgetAPI.checkStatus(),
        goalsAPI.getAll()
      ]);

      const newNotifications: Notification[] = [];

      // Check budget alerts
      if (budgetResponse.data?.status?.alerts) {
        budgetResponse.data.status.alerts.forEach((alert: any) => {
          if (alert.type === 'budget_exceeded') {
            newNotifications.push({
              id: `budget_exceeded_${Date.now()}`,
              type: 'error',
              title: '🚨 Budget Exceeded!',
              message: `You've exceeded your budget by ${currencySymbol}${(alert.amount - alert.budget).toFixed(2)}. This will reduce your savings and may affect your financial goals.`,
              action: {
                label: 'Adjust Budget',
                onClick: () => window.location.href = '/budget-planner'
              }
            });
          } else if (alert.type === 'savings_reduced') {
            newNotifications.push({
              id: `savings_reduced_${Date.now()}`,
              type: 'error',
              title: '💰 Savings Reduced!',
              message: `${currencySymbol}${alert.amount.toFixed(2)} deducted from your savings due to budget excess. Remaining savings: ${currencySymbol}${alert.remainingSavings.toFixed(2)}`,
              action: {
                label: 'View Savings',
                onClick: () => window.location.href = '/savings'
              }
            });
          } else if (alert.type === 'insufficient_savings') {
            newNotifications.push({
              id: `insufficient_savings_${Date.now()}`,
              type: 'error',
              title: '⚠️ Insufficient Savings!',
              message: `Budget exceeded by ${currencySymbol}${alert.amount.toFixed(2)} but insufficient savings to cover the excess. Consider adjusting your budget or increasing income.`,
              action: {
                label: 'View Budget',
                onClick: () => window.location.href = '/budget-planner'
              }
            });
          } else if (alert.type === 'category_exceeded') {
            newNotifications.push({
              id: `category_exceeded_${alert.category}_${Date.now()}`,
              type: 'warning',
              title: `📊 ${alert.category} Budget Exceeded`,
              message: `You've spent ${currencySymbol}${alert.amount.toFixed(2)} out of ${currencySymbol}${alert.budget.toFixed(2)} in ${alert.category}`,
              action: {
                label: 'View Expenses',
                onClick: () => window.location.href = '/expenses'
              }
            });
          }
        });
      }

      // Check if approaching budget limits (80% threshold)
      if (budgetResponse.data?.status?.monthly) {
        const monthlyStatus = budgetResponse.data.status.monthly;
        if (monthlyStatus.percentage >= 80 && monthlyStatus.percentage < 100) {
          newNotifications.push({
            id: `budget_warning_${Date.now()}`,
            type: 'warning',
            title: '⚠️ Budget Warning',
            message: `You've used ${monthlyStatus.percentage}% of your monthly budget. ${currencySymbol}${monthlyStatus.remaining.toFixed(2)} remaining.`,
            action: {
              label: 'Track Expenses',
              onClick: () => window.location.href = '/expenses'
            }
          });
        }
      }

      // Check financial goals progress
      if (goalsResponse.data?.goals) {
        goalsResponse.data.goals.forEach((goal: any) => {
          const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const timeLeft = new Date(goal.targetDate).getTime() - Date.now();
          const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
          
          // If goal is behind schedule (less than expected progress)
          const expectedProgress = (1 - (daysLeft / goal.totalDays)) * 100;
          if (progressPercentage < expectedProgress && daysLeft > 0 && daysLeft < 90) {
            newNotifications.push({
              id: `goal_behind_${goal._id}`,
              type: 'warning',
              title: '🎯 Goal Behind Schedule',
              message: `Your goal "${goal.title}" is ${(expectedProgress - progressPercentage).toFixed(1)}% behind schedule. You need to save ${currencySymbol}${((goal.targetAmount - goal.currentAmount) / daysLeft).toFixed(2)} per day.`,
              action: {
                label: 'View Goals',
                onClick: () => window.location.href = '/financial-goals'
              }
            });
          }
        });
      }

      setNotifications(newNotifications);
      setShowNotifications(newNotifications.length > 0);
    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  if (!showNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: 0,
      right: 0,
      zIndex: 1050,
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      
      <div className="container">
        <div className="d-flex justify-content-between align-items-center py-2">
          <div className="flex-grow-1">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="d-flex align-items-center mb-2">
                <div className={`alert alert-${notification.type === 'error' ? 'danger' : notification.type} mb-0 me-2 flex-grow-1`} style={{
                  fontSize: '14px',
                  padding: '8px 12px',
                  margin: 0
                }}>
                  <strong>{notification.title}</strong> {notification.message}
                  {notification.action && (
                    <button
                      className={`btn btn-sm btn-outline-${notification.type === 'error' ? 'danger' : notification.type} ms-2`}
                      onClick={notification.action.onClick}
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => dismissNotification(notification.id)}
                  style={{ fontSize: '12px', padding: '2px 8px' }}
                >
                  ×
                </button>
              </div>
            ))}
            {notifications.length > 3 && (
              <small className="text-light">
                +{notifications.length - 3} more notifications
              </small>
            )}
          </div>
          <button
            className="btn btn-sm btn-outline-light ms-3"
            onClick={dismissAll}
          >
            Dismiss All
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBar;