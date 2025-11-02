import React, { useState, useEffect } from 'react';
import { incomeAPI } from '../services/api';
import { getCurrentDate, formatLocalDate } from '../utils/dateUtils';
import { useAuth } from '../utils/AuthContext';
import '../styles/Theme.css';

const IncomeTracking: React.FC = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    type: 'Salary',
    description: '',
    date: getCurrentDate().toISOString().split('T')[0]
  });

  const types = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Bonus', 'Other'];

  useEffect(() => {
    fetchIncomes();
    fetchInsights();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await incomeAPI.getAll();
      setIncomes(response.data.incomes || []);
    } catch (err: any) {
      setError('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await incomeAPI.getInsights();
      setInsights(response.data.insights);
    } catch (err) {
      console.error('Failed to fetch insights');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await incomeAPI.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });

      // Show success message with auto-deposit info
      let msg = 'Income added successfully!';
      if (response.data.autoDeposit) {
        msg += `\n\n ${response.data.autoDeposit.message}`;
      }

      setMessage(msg);
      setShowForm(false);
      setFormData({
        amount: '',
        source: '',
        type: 'Salary',
        description: '',
        date: getCurrentDate().toISOString().split('T')[0]
      });
      fetchIncomes();
      fetchInsights();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to add income');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await incomeAPI.delete(id);
        setMessage('Income deleted successfully!');
        fetchIncomes();
        fetchInsights();
      } catch (err: any) {
        setError('Failed to delete income');
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>Track Your Income</h2>
          <p>Manage your income sources and view spending insights</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {insights && (
          <div className="alert alert-info fade-in">
            <h5>Monthly Insights</h5>
            <div className="row">
              <div className="col-md-4">
                <strong>Total Income:</strong>
                <h4 className="text-success">{currencySymbol}{insights.totalIncome?.toFixed(2) || 0}</h4>
              </div>
              <div className="col-md-4">
                <strong>Total Expenses:</strong>
                <h4 className="text-danger">{currencySymbol}{insights.totalExpenses?.toFixed(2) || 0}</h4>
              </div>
              <div className="col-md-4">
                <strong>Current Balance:</strong>
                <h4 className={`${insights.remainingAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                  {currencySymbol}{insights.remainingAmount?.toFixed(2) || 0}
                </h4>
              </div>
            </div>
            {insights.daysRemaining > 0 && insights.remainingAmount > 0 && (
              <p className="mt-3 mb-0">
                <em>{insights.daysRemaining} days remaining in this month.
                   You have {currencySymbol}{(insights.remainingAmount / insights.daysRemaining).toFixed(2)} per day available.</em>
              </p>
            )}
            {insights.message && (
              <p className="mt-2 mb-0">
                <strong>Tip:</strong> {insights.message}
              </p>
            )}
          </div>
        )}

        <button
          className="btn btn-primary mb-4"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Income'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="card p-4 mb-4 bg-purple-light">
            <h4>Add New Income</h4>

            <div className="row">
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
                  placeholder="e.g., 50000"
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Source *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  required
                  placeholder="e.g., Company Name, Client Name"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label>Type *</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
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

            <button type="submit" className="btn btn-primary">Add Income</button>
          </form>
        )}

        <h4>Income History</h4>
        {loading ? (
          <p>Loading income records...</p>
        ) : incomes.length === 0 ? (
          <p>No income records yet. Add your first income entry!</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income) => (
                    <tr key={income._id}>
                      <td>{formatLocalDate(income.date)}</td>
                      <td>{income.source}</td>
                      <td><span className="badge badge-success">{income.type}</span></td>
                      <td>{income.description || '-'}</td>
                      <td><strong>{currencySymbol}{income.amount.toFixed(2)}</strong></td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(income._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <h5>Summary by Type</h5>
              <div className="row">
                {types.map(type => {
                  const total = incomes
                    .filter(inc => inc.type === type)
                    .reduce((sum, inc) => sum + inc.amount, 0);

                  if (total > 0) {
                    return (
                      <div key={type} className="col-md-3 mb-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h6>{type}</h6>
                            <h4 className="text-success">{currencySymbol}{total.toFixed(2)}</h4>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IncomeTracking;
