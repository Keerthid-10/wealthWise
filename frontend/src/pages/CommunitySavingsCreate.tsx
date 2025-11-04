import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { communitySavingsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import '../styles/CommunitySavings.css';

const CommunitySavingsCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    monthlyContribution: '',
    totalCycles: '',
    startDate: '',
    payoutMethod: 'rotation',
    latePenaltyPercentage: '5',
    gracePeriodDays: '3',
    reminderDaysBefore: '3',
    rules: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        groupName: formData.groupName,
        description: formData.description,
        monthlyContribution: parseFloat(formData.monthlyContribution),
        currency: user?.currency || 'INR',
        totalCycles: parseInt(formData.totalCycles),
        startDate: formData.startDate || new Date().toISOString(),
        payoutMethod: formData.payoutMethod,
        latePenaltyPercentage: parseFloat(formData.latePenaltyPercentage),
        gracePeriodDays: parseInt(formData.gracePeriodDays),
        reminderDaysBefore: parseInt(formData.reminderDaysBefore),
        rules: formData.rules
      };

      const response = await communitySavingsAPI.create(data);
      navigate(`/community-savings/${response.data.group._id}`);
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-primary mb-3" onClick={() => navigate('/community-savings')}>
        <i className="bi bi-arrow-left"></i> Back to Groups
      </button>

      <div className="card">
        <div className="card-header">
          <h2><i className="bi bi-plus-circle"></i> Create Community Savings Group</h2>
          <p>Set up a savings group and invite members to save together</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  name="groupName"
                  className="form-control"
                  value={formData.groupName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Family Savings Circle"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-group">
                <label>Monthly Contribution ({user?.currency || 'INR'}) *</label>
                <input
                  type="number"
                  name="monthlyContribution"
                  className="form-control"
                  value={formData.monthlyContribution}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the purpose of this savings group..."
            />
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>Total Members (Cycles) *</label>
                <input
                  type="number"
                  name="totalCycles"
                  className="form-control"
                  value={formData.totalCycles}
                  onChange={handleChange}
                  required
                  min="2"
                  max="20"
                  placeholder="e.g., 10"
                />
                <small className="text-muted">Number of members who will participate</small>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-control"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>Payout Method *</label>
                <select
                  name="payoutMethod"
                  className="form-control"
                  value={formData.payoutMethod}
                  onChange={handleChange}
                >
                  <option value="rotation">Rotation (By Position)</option>
                  <option value="voting">Voting (Members Vote)</option>
                </select>
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Late Penalty (%)</label>
                <input
                  type="number"
                  name="latePenaltyPercentage"
                  className="form-control"
                  value={formData.latePenaltyPercentage}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Grace Period (Days)</label>
                <input
                  type="number"
                  name="gracePeriodDays"
                  className="form-control"
                  value={formData.gracePeriodDays}
                  onChange={handleChange}
                  min="0"
                  max="30"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Group Rules (Optional)</label>
            <textarea
              name="rules"
              className="form-control"
              value={formData.rules}
              onChange={handleChange}
              rows={4}
              placeholder="e.g., All members must contribute by the 5th of each month. Late payments incur penalties. Payouts are processed on the 10th of each month."
            />
          </div>

          <div className="alert alert-info">
            <strong>How it works:</strong>
            <ul className="mb-0 mt-2">
              <li>You'll be added as the first member automatically</li>
              <li>Invite registered users by their email addresses</li>
              <li>Each member contributes the monthly amount</li>
              <li>One member receives the total pot each month (based on rotation/voting)</li>
              <li>Group completes when all members have received their payout</li>
            </ul>
          </div>

          <div className="d-flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/community-savings')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunitySavingsCreate;
