import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';
import '../styles/Theme.css';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currency: 'INR'
  });

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'AED'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setProfile(response.data.user);
      setFormData({
        name: response.data.user.name,
        phone: response.data.user.phone || '',
        currency: response.data.user.currency || 'INR'
      });
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await authAPI.updateProfile(formData);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>My Profile</h2>
          <p>View and manage your account information</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {!editing ? (
          <div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Name:</strong>
                <p>{profile?.name}</p>
              </div>
              <div className="col-md-6">
                <strong>Email:</strong>
                <p>{profile?.email}</p>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Phone:</strong>
                <p>{profile?.phone || 'Not provided'}</p>
              </div>
              <div className="col-md-6">
                <strong>Date of Birth:</strong>
                <p>{profile?.dob ? formatLocalDate(profile.dob) : 'Not provided'}</p>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Preferred Currency:</strong>
                <p>{profile?.currency || 'INR'}</p>
              </div>
              <div className="col-md-6">
                <strong>Member Since:</strong>
                <p>{profile?.createdAt ? formatLocalDate(profile.createdAt) : '-'}</p>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 1234567890"
              />
            </div>

            <div className="form-group">
              <label>Preferred Currency *</label>
              <select
                className="form-control"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                required
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <button type="submit" className="btn btn-primary me-2">
                Save Changes
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
