import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Auth.css';

const OTPDisplay: React.FC = () => {
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    // Get OTP from URL parameters
    const params = new URLSearchParams(location.search);
    const otpParam = params.get('otp');
    const emailParam = params.get('email');
    const expiresParam = params.get('expires');

    if (otpParam) setOtp(otpParam);
    if (emailParam) setEmail(emailParam);
    if (expiresParam) setExpiresAt(expiresParam);
  }, [location]);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(otp);
    alert('OTP copied to clipboard!');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="auth-title">Your 4-Digit OTP</h2>
          <p className="auth-subtitle">
            Password reset OTP for {email}
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '2rem',
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: '1.5rem',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            letterSpacing: '0.5rem',
            color: '#8b5cf6',
            fontFamily: 'monospace'
          }}>
            {otp}
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="btn btn-primary w-100 mb-3"
          style={{ background: '#8b5cf6', border: 'none' }}
        >
          Copy OTP
        </button>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '5px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <strong>Expires in: {formatTime(timeLeft)}</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
              This OTP is valid for 10 minutes
            </p>
          </div>
        </div>

        <div style={{
          background: '#e7f3ff',
          border: '1px solid #2196F3',
          borderRadius: '5px',
          padding: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            Instructions:
          </h4>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
            <li>Copy the OTP above</li>
            <li>Go back to the password reset page</li>
            <li>Enter this OTP in the form</li>
            <li>Enter your new password</li>
            <li>Click "Reset Password"</li>
          </ol>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '5px'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            Keep this window open for reference or bookmark it
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPDisplay;
