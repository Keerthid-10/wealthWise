import React, { useState, useEffect, useRef } from 'react';
import { budgetAPI, goalsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkForNotifications = async () => {
    try {
      const [budgetResponse, goalsResponse] = await Promise.all([
        budgetAPI.checkStatus(),
        goalsAPI.getAll()
      ]);

      const newNotifications: Notification[] = [];

      // Check budget alerts
      if (budgetResponse.data?.status?.alerts) {
        console.log('Budget Alerts Found:', budgetResponse.data.status.alerts);
        budgetResponse.data.status.alerts.forEach((alert: any) => {
          if (alert.type === 'budget_exceeded') {
            newNotifications.push({
              id: `budget_exceeded_${Date.now()}`,
              type: 'error',
              title: '🚨 Budget Exceeded',
              message: `Exceeded by ${currencySymbol}${(alert.amount - alert.budget).toFixed(2)}`,
              timestamp: new Date(),
              action: {
                label: 'View Budget',
                onClick: () => window.location.href = '/budget-planner'
              }
            });
          } else if (alert.type === 'savings_reduced') {
            newNotifications.push({
              id: `savings_reduced_${Date.now()}`,
              type: 'warning',
              title: '💰 Savings Reduced',
              message: `${currencySymbol}${alert.amount.toFixed(2)} deducted from savings`,
              timestamp: new Date(),
              action: {
                label: 'View Savings',
                onClick: () => window.location.href = '/savings'
              }
            });
          } else if (alert.type === 'insufficient_savings') {
            newNotifications.push({
              id: `insufficient_savings_${Date.now()}`,
              type: 'error',
              title: '⚠️ Insufficient Savings',
              message: `Budget exceeded but no savings to cover excess`,
              timestamp: new Date(),
              action: {
                label: 'Add Savings',
                onClick: () => window.location.href = '/savings'
              }
            });
          } else if (alert.type === 'monthly_appreciation') {
            newNotifications.push({
              id: `monthly_appreciation_${Date.now()}`,
              type: 'success',
              title: '🎉 Budget Champion!',
              message: alert.message,
              timestamp: new Date(),
              action: {
                label: 'View Budget',
                onClick: () => window.location.href = '/budget-planner'
              }
            });
          } else if (alert.type === 'early_appreciation') {
            newNotifications.push({
              id: `early_appreciation_${Date.now()}`,
              type: 'success',
              title: '👏 Spending Hero!',
              message: alert.message,
              timestamp: new Date()
            });
          } else if (alert.type === 'month_end_celebration') {
            newNotifications.push({
              id: `month_end_celebration_${Date.now()}`,
              type: 'success',
              title: '🏆 Monthly Success!',
              message: alert.message,
              timestamp: new Date(),
              action: {
                label: 'View Reports',
                onClick: () => window.location.href = '/reports'
              }
            });
          } else if (alert.type === 'category_savings_reduced') {
            newNotifications.push({
              id: `category_savings_reduced_${alert.category}_${Date.now()}`,
              type: 'error',
              title: `💰 ${alert.category} Savings Reduced`,
              message: `${currencySymbol}${alert.amount.toFixed(2)} deducted from savings for ${alert.category} overspending`,
              timestamp: new Date(),
              action: {
                label: 'View Savings',
                onClick: () => window.location.href = '/savings'
              }
            });
          } else if (alert.type === 'category_insufficient_savings') {
            newNotifications.push({
              id: `category_insufficient_savings_${alert.category}_${Date.now()}`,
              type: 'error',
              title: `⚠️ ${alert.category} Insufficient Savings`,
              message: `${alert.category} budget exceeded by ${currencySymbol}${alert.amount.toFixed(2)} but insufficient savings to cover excess`,
              timestamp: new Date(),
              action: {
                label: 'Add Savings',
                onClick: () => window.location.href = '/savings'
              }
            });
          } else if (alert.type === 'category_exceeded') {
            newNotifications.push({
              id: `category_exceeded_${alert.category}_${Date.now()}`,
              type: 'warning',
              title: `📊 ${alert.category} Budget Exceeded`,
              message: `You've spent ${currencySymbol}${alert.amount.toFixed(2)} out of ${currencySymbol}${alert.budget.toFixed(2)} in ${alert.category}`,
              timestamp: new Date(),
              action: {
                label: 'View Expenses',
                onClick: () => window.location.href = '/expenses'
              }
            });
          }
        });
      }

      // Achievement notifications are now handled by the backend

      // Check financial goals progress
      if (goalsResponse.data?.goals) {
        goalsResponse.data.goals.forEach((goal: any) => {
          const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const timeLeft = new Date(goal.targetDate).getTime() - Date.now();
          const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
          
          // Goal approaching deadline
          if (daysLeft > 0 && daysLeft <= 30 && progressPercentage < 80) {
            newNotifications.push({
              id: `goal_deadline_${goal._id}`,
              type: 'warning',
              title: '🎯 Goal Deadline Approaching',
              message: `"${goal.title}" needs ${currencySymbol}${(goal.targetAmount - goal.currentAmount).toFixed(2)} in ${daysLeft} days`,
              timestamp: new Date(),
              action: {
                label: 'View Goals',
                onClick: () => window.location.href = '/financial-goals'
              }
            });
          }

          // Goal completed
          if (progressPercentage >= 100) {
            newNotifications.push({
              id: `goal_completed_${goal._id}`,
              type: 'success',
              title: '🏆 Goal Achieved!',
              message: `Congratulations! You've achieved "${goal.title}"`,
              timestamp: new Date(),
              action: {
                label: 'View Goals',
                onClick: () => window.location.href = '/financial-goals'
              }
            });
          }
        });
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAsRead();
        }}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          transition: 'background-color 0.2s ease',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#e74c3c',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            marginTop: '5px'
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eee',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: notification.action ? 'pointer' : 'default'
                  }}
                  onClick={notification.action?.onClick}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: '13px',
                      color: notification.type === 'error' ? '#e74c3c' :
                             notification.type === 'warning' ? '#f39c12' :
                             notification.type === 'success' ? '#27ae60' : '#3498db',
                      marginBottom: '4px'
                    }}
                  >
                    {notification.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4',
                      marginBottom: '4px'
                    }}
                  >
                    {notification.message}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#999'
                    }}
                  >
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;