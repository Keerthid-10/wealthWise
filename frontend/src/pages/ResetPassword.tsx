import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get email and OTP from URL params or state
  const params = new URLSearchParams(location.search);
  const emailFromUrl = params.get('email');
  const otpFromUrl = params.get('otp');
  const stateData = location.state || {};

  const [email, setEmail] = useState(emailFromUrl || stateData.email || '');
  const [otp, setOtp] = useState(otpFromUrl || stateData.otp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!email || !otp) {
      setError('Invalid reset request. Please start over.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/password-reset/confirm`, {
        email,
        otp,
        newPassword
      });

      alert('Password reset successful! You can now login with your new password.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit}>
          {!emailFromUrl && (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
          )}

          {!otpFromUrl && (
            <div className="form-group">
              <label htmlFor="otp">OTP</label>
              <input
                type="text"
                id="otp"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                style={{
                  fontSize: '20px',
                  letterSpacing: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <span className="auth-link" onClick={() => navigate('/login')}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
