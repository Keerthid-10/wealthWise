import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // Store the generated OTP
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification, 3: Password Reset
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpDisplay, setShowOtpDisplay] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const openOtpInNewTab = (otp: string) => {
    const otpHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Your OTP - WealthWise</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .otp-container {
              background: white;
              padding: 50px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
              width: 90%;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              color: #333;
              margin-bottom: 20px;
            }
            .otp-display {
              font-size: 64px;
              font-weight: bold;
              letter-spacing: 20px;
              color: #667eea;
              background: #f8f9ff;
              padding: 30px;
              border-radius: 15px;
              margin: 30px 0;
              font-family: monospace;
              border: 3px dashed #667eea;
            }
            .instructions {
              color: #666;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .copy-btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .copy-btn:hover {
              background: #5a6fd8;
              transform: translateY(-2px);
            }
            .timer {
              color: #e74c3c;
              font-weight: bold;
              margin-top: 20px;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="otp-container">
            <div class="logo">💰 WealthWise</div>
            <div class="title">Your Password Reset OTP</div>
            <div class="otp-display" id="otpDisplay">${otp}</div>
            <div class="instructions">
              Copy this OTP and paste it in the password reset form to continue.
              <br><strong>This OTP is valid for 10 minutes only.</strong>
            </div>
            <button class="copy-btn" onclick="copyOtp()">📋 Copy OTP</button>
            <div class="timer" id="timer">Valid for: 10:00</div>
          </div>
          
          <script>
            function copyOtp() {
              const otp = '${otp}';
              navigator.clipboard.writeText(otp).then(() => {
                alert('OTP copied to clipboard!');
              });
            }
            
            // Timer countdown
            let timeLeft = 600; // 10 minutes in seconds
            function updateTimer() {
              const minutes = Math.floor(timeLeft / 60);
              const seconds = timeLeft % 60;
              document.getElementById('timer').textContent = 
                'Valid for: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
              
              if (timeLeft > 0) {
                timeLeft--;
                setTimeout(updateTimer, 1000);
              } else {
                document.getElementById('timer').textContent = 'OTP Expired!';
                document.getElementById('timer').style.color = '#e74c3c';
              }
            }
            updateTimer();
          </script>
        </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(otpHtml);
      newWindow.document.close();
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/password-reset/request`, {
        email
      });

      if (response.data.otp) {
        setGeneratedOtp(response.data.otp);
        setShowOtpDisplay(true);
        openOtpInNewTab(response.data.otp);
        setMessage(`✅ OTP Generated Successfully! Check the new tab for your OTP.`);
        setStep(2); // Move to OTP verification step
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/password-reset/request`, {
        email
      });

      if (response.data.otp) {
        setGeneratedOtp(response.data.otp);
        setShowOtpDisplay(true);
        openOtpInNewTab(response.data.otp);
        setMessage(`✅ New OTP Generated! Check the new tab for your updated OTP.`);
        setOtp(''); // Clear the previously entered OTP
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedOtp);
    setMessage('✅ OTP copied to clipboard!');
    setTimeout(() => setMessage('OTP generated successfully!'), 2000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/password-reset/verify-otp`, {
        email,
        otp
      });

      setMessage('✅ OTP verified successfully! Now set your new password.');
      setStep(3); // Move to password reset step
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/password-reset/confirm`, {
        email,
        otp,
        newPassword
      });

      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>
        
        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            <small className={`${step >= 1 ? 'text-primary' : 'text-muted'}`}>Email</small>
            <small className={`${step >= 2 ? 'text-primary' : 'text-muted'}`}>Verify OTP</small>
            <small className={`${step >= 3 ? 'text-primary' : 'text-muted'}`}>New Password</small>
          </div>
          <div className="progress" style={{ height: '4px' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${(step / 3) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>
        
        <p className="auth-subtitle">
          {step === 1
            ? "Enter your email to receive an OTP"
            : step === 2
            ? "Enter the OTP to verify your identity"
            : "Set your new password"}
        </p>

        {/* Debug info - remove this after testing */}
        <div style={{ background: '#f0f0f0', padding: '5px', margin: '10px 0', fontSize: '12px' }}>
          Current Step: {step} | Email: {email} | OTP: {otp}
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOTP} key="email-form" style={{ display: 'block' }}>
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
                autoFocus
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
              style={{
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating OTP...
                </>
              ) : (
                '🔐 Generate OTP'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div key="otp-form" style={{ display: 'block' }}>
            {/* OTP Display Box */}
            {showOtpDisplay && generatedOtp && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px',
                borderRadius: '15px',
                marginBottom: '25px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{
                  color: 'white',
                  fontSize: '14px',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Your 4-Digit OTP
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  letterSpacing: '15px',
                  color: 'white',
                  fontFamily: 'monospace',
                  marginBottom: '15px'
                }}>
                  {generatedOtp}
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="btn btn-light"
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  📋 Copy OTP
                </button>
                <div style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  marginTop: '15px'
                }}>
                  ⏱️ Valid for 10 minutes
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  className="form-control"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  placeholder="Enter the 4-digit OTP"
                  maxLength={4}
                  style={{
                    fontSize: '20px',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                  autoFocus
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
                style={{ padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Verifying OTP...
                  </>
                ) : (
                  '✅ Verify OTP'
                )}
              </button>

              <div className="row mt-3">
                <div className="col-6">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                      setError('');
                      setMessage('');
                    }}
                  >
                    ← Back
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : '🔄 Resend OTP'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div key="password-form" style={{ display: 'block' }}>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password (min 6 characters)"
                  autoFocus
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
              {message && <div className="alert alert-success">{message}</div>}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
                style={{ padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resetting Password...
                  </>
                ) : (
                  '🔐 Reset Password'
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary w-100 mt-3"
                onClick={() => {
                  setStep(2);
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                  setMessage('');
                }}
              >
                ← Back to OTP
              </button>
            </form>
          </div>
        )}

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

export default ForgotPassword;
