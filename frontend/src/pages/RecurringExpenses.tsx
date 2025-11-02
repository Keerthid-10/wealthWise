import React, { useState, useEffect } from 'react';
import { recurringAPI } from '../services/api';
import { getCurrentDate } from '../utils/dateUtils';
import '../styles/Theme.css';

const RecurringExpenses: React.FC = () => {
  const [recurring, setRecurring] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Bills',
    frequency: 'monthly',
    dayOfMonth: '1',
    merchant: '',
    description: '',
    startDate: getCurrentDate().toISOString().split('T')[0]
  });

  const categories = ['Bills', 'Rent', 'EMI', 'Subscription', 'Insurance', 'Utilities', 'Membership', 'Other'];

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const response = await recurringAPI.getAll();
      setRecurring(response.data.recurring || []);
    } catch (err: any) {
      setError('Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await recurringAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth),
        isActive: true
      });

      setMessage('Recurring expense added successfully! It will be automatically added on the due date.');
      setShowForm(false);
      setFormData({
        title: '',
        amount: '',
        category: 'Bills',
        frequency: 'monthly',
        dayOfMonth: '1',
        merchant: '',
        description: '',
        startDate: getCurrentDate().toISOString().split('T')[0]
      });
      fetchRecurring();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to add recurring expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      try {
        await recurringAPI.delete(id);
        setMessage('Recurring expense deleted successfully!');
        fetchRecurring();
      } catch (err: any) {
        setError('Failed to delete recurring expense');
      }
    }
  };

  const getDaysUntilDue = (dayOfMonth: number) => {
    const today = getCurrentDate();
    const currentDay = today.getDate();

    if (dayOfMonth > currentDay) {
      return dayOfMonth - currentDay;
    } else if (dayOfMonth < currentDay) {
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return (lastDayOfMonth - currentDay) + dayOfMonth;
    } else {
      return 0; // Due today
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>Recurring Expenses</h2>
          <p>Manage your recurring expenses like rent, EMI, subscriptions. They will be automatically added on due dates.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="alert alert-info">
          <strong>How it works:</strong> Add your recurring expenses with their due dates.
          The system will automatically add them to your expenses when the date arrives.
          You'll also receive reminders before the due date!
        </div>

        <button
          className="btn btn-primary mb-4"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Recurring Expense'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="card p-4 mb-4 bg-purple-light">
            <h4>Add New Recurring Expense</h4>

            <div className="row">
              <div className="col-md-6 form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="e.g., House Rent, Internet Bill"
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  step="0.01"
                  min="0"
                  placeholder="e.g., 15000"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 form-group">
                <label>Category *</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Frequency *</label>
                <select
                  className="form-control"
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Day of Month *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({...formData, dayOfMonth: e.target.value})}
                  required
                  min="1"
                  max="31"
                  placeholder="1-31"
                />
                <small className="text-muted">Day when payment is due</small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label>Merchant/Payee</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.merchant}
                  onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                  placeholder="e.g., Landlord Name, Service Provider"
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional notes"
              />
            </div>

            <button type="submit" className="btn btn-primary">Add Recurring Expense</button>
          </form>
        )}

        <h4>Your Recurring Expenses</h4>
        {loading ? (
          <p>Loading recurring expenses...</p>
        ) : recurring.length === 0 ? (
          <p>No recurring expenses yet. Add your first one!</p>
        ) : (
          <div className="row">
            {recurring.map((item) => {
              const daysUntil = getDaysUntilDue(item.dayOfMonth);
              let statusClass = 'badge-success';
              let statusText = `Due on day ${item.dayOfMonth}`;

              if (daysUntil === 0) {
                statusClass = 'badge-danger';
                statusText = 'Due Today!';
              } else if (daysUntil <= 3) {
                statusClass = 'badge-warning';
                statusText = `Due in ${daysUntil} days`;
              } else {
                statusText = `Due in ${daysUntil} days`;
              }

              return (
                <div key={item._id} className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0">{item.title}</h5>
                        <span className={`badge ${statusClass}`}>{statusText}</span>
                      </div>

                      <p><strong>Amount:</strong> ₹{item.amount.toFixed(2)}</p>
                      <p><strong>Category:</strong> {item.category}</p>
                      <p><strong>Frequency:</strong> {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}</p>
                      <p><strong>Due on:</strong> Day {item.dayOfMonth} of each month</p>

                      {item.merchant && <p><strong>Payee:</strong> {item.merchant}</p>}
                      {item.description && <p className="text-muted"><em>{item.description}</em></p>}

                      <div className="mt-3">
                        <span className={`badge ${item.isActive ? 'badge-success' : 'badge-secondary'} me-2`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recurring.length > 0 && (
          <div className="alert alert-info mt-4">
            <strong>=₹ Tip:</strong> You'll receive reminders on the home page when these expenses are due soon!
            <br />
            Total Monthly Recurring: ₹{recurring.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringExpenses;
