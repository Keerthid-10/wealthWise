import React, { useState, useEffect } from 'react';
import { goalsAPI } from '../services/api';
import { formatLocalDate, getCurrentDate } from '../utils/dateUtils';
import '../styles/Theme.css';

const FinancialGoals: React.FC = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    category: 'Emergency Fund',
    startDate: getCurrentDate().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });

  const categories = ['Emergency Fund', 'Vacation', 'Home', 'Car', 'Education', 'Retirement', 'Wedding', 'Investment', 'Other'];

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getAll();
      setGoals(response.data.goals || []);
    } catch (err: any) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await goalsAPI.create({
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        status: 'active'
      });

      setMessage('Financial goal created successfully!');
      setShowForm(false);
      setFormData({
        title: '',
        targetAmount: '',
        currentAmount: '0',
        category: 'Emergency Fund',
        startDate: getCurrentDate().toISOString().split('T')[0],
        endDate: '',
        description: ''
      });
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to create goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalsAPI.delete(id);
        setMessage('Goal deleted successfully!');
        fetchGoals();
      } catch (err: any) {
        setError('Failed to delete goal');
      }
    }
  };

  const handleUpdateProgress = async (id: string, additionalAmount: string) => {
    const amount = parseFloat(additionalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await goalsAPI.updateProgress(id, amount);
      setMessage('Progress updated!');
      fetchGoals();
    } catch (err: any) {
      setError('Failed to update progress');
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>Set Financial Goals</h2>
          <p>Set and track your financial goals with start and end dates</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <button
          className="btn btn-primary mb-4"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Set New Goal'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="card p-4 mb-4 bg-purple-light">
            <h4>Create New Financial Goal</h4>

            <div className="form-group">
              <label>Goal Title *</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="e.g., Build Emergency Fund"
              />
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label>Target Amount *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  required
                  step="0.01"
                  min="0"
                  placeholder="e.g., 100000"
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Current Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                  step="0.01"
                  min="0"
                  placeholder="Starting amount (optional)"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
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
            </div>

            <div className="row">
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
              <div className="col-md-6 form-group">
                <label>End Date (Target Deadline) *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                  min={formData.startDate}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Optional notes about your goal"
              />
            </div>

            <button type="submit" className="btn btn-primary">Create Goal</button>
          </form>
        )}

        <h4>Your Financial Goals</h4>
        {loading ? (
          <p>Loading goals...</p>
        ) : goals.length === 0 ? (
          <p>No goals yet. Set your first financial goal!</p>
        ) : (
          <div className="row">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0
                ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)
                : 0;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div key={goal._id} className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0">{goal.title}</h5>
                        <span className={`badge ${goal.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                          {goal.status}
                        </span>
                      </div>

                      <p className="text-muted">{goal.description}</p>
                      <p><strong>Category:</strong> {goal.category}</p>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span><strong>Progress:</strong> {progress}%</span>
                          <span>₹{goal.currentAmount.toFixed(2)} / ₹{goal.targetAmount.toFixed(2)}</span>
                        </div>
                        <div className="progress" style={{height: '20px'}}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{width: `${progress}%`}}
                            aria-valuenow={Number(progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            {progress}%
                          </div>
                        </div>
                      </div>

                      <p><strong>Remaining:</strong> ₹{remaining.toFixed(2)}</p>
                      <p><strong>Start Date:</strong> {formatLocalDate(goal.startDate)}</p>
                      <p><strong>Target Date:</strong> {formatLocalDate(goal.endDate)}</p>

                      <div className="mt-3">
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => {
                            const amount = prompt('Enter amount to add to this goal:');
                            if (amount) {
                              handleUpdateProgress(goal._id, amount);
                            }
                          }}
                        >
                          Add Progress
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(goal._id)}
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
      </div>
    </div>
  );
};

export default FinancialGoals;
