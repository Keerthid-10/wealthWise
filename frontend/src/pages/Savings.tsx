import React, { useState, useEffect } from 'react';
import { savingsAPI } from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';
import { useAuth } from '../utils/AuthContext';
import '../styles/Theme.css';

const Savings: React.FC = () => {
  const { user } = useAuth();
  const [savings, setSavings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [depositAmount, setDepositAmount] = useState('');
  const [depositReason, setDepositReason] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');

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
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const response = await savingsAPI.getAccount();
      console.log('Savings account data:', response.data.savings);
      setSavings(response.data.savings);
    } catch (err: any) {
      // If no savings account exists, it will be created on first deposit
      if (err.response?.status === 404) {
        setSavings({
          currentAmount: 0,
          monthlyTarget: 0,
          transactions: []
        });
      } else {
        setError('Failed to load savings account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreAll = async () => {
    if (window.confirm('This will restore all budget-related withdrawals. Continue?')) {
      try {
        setLoading(true);
        const response = await savingsAPI.restoreAll();
        setMessage(response.data.message || 'All budget-related withdrawals restored!');
        fetchSavings();
      } catch (err: any) {
        setError(err.response?.data?.errors?.[0] || 'Failed to restore savings');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await savingsAPI.deposit(amount, depositReason || undefined);
      setMessage(`Successfully deposited ${currencySymbol}${amount.toFixed(2)}!`);
      setDepositAmount('');
      setDepositReason('');
      fetchSavings();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to deposit');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (savings && amount > savings.currentAmount) {
      setError('Insufficient balance');
      return;
    }

    try {
      const response = await savingsAPI.withdraw(amount, withdrawReason || undefined);

      // Show success message with personalized advice
      let msg = `Successfully withdrawn ${currencySymbol}${amount.toFixed(2)}!`;
      if (response.data.advice) {
        msg += `\n\n${response.data.advice}`;
      }

      setMessage(msg);
      setWithdrawAmount('');
      setWithdrawReason('');
      fetchSavings();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to withdraw');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="card">
          <p>Loading savings account...</p>
        </div>
      </div>
    );
  }

  const monthlyProgress = savings?.monthlyTarget > 0
    ? ((savings.currentAmount / savings.monthlyTarget) * 100).toFixed(0)
    : 0;

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Savings Account</h2>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={fetchSavings}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
              <button
                className="btn btn-warning"
                onClick={handleRestoreAll}
                disabled={loading}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Restore All
              </button>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {/* Current Balance */}
        <div className="card mb-4" style={{background: 'linear-gradient(135deg, #9b7bbf 0%, #7856a1 100%)', color: 'white'}}>
          <div className="card-body text-center">
            <h3>Current Savings Balance</h3>
            <h1 style={{fontSize: '48px', fontWeight: 'bold'}}>
              {currencySymbol}{savings?.currentAmount?.toFixed(2) || '0.00'}
            </h1>
            {savings?.monthlyTarget > 0 && (
              <div className="mt-3">
                <p>Monthly Target: {currencySymbol}{savings.monthlyTarget.toFixed(2)}</p>
                <div className="progress" style={{height: '25px', background: 'rgba(255,255,255,0.3)'}}>
                  <div
                    className="progress-bar"
                    style={{background: '#28a745'}}
                    role="progressbar"
                    aria-valuenow={Number(monthlyProgress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    {monthlyProgress}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deposit and Withdraw Forms */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card bg-purple-light">
              <div className="card-body">
                <h5>Deposit Money</h5>
                <form onSubmit={handleDeposit}>
                  <div className="form-group">
                    <label>Amount *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reason (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={depositReason}
                      onChange={(e) => setDepositReason(e.target.value)}
                      placeholder="e.g., Monthly savings"
                    />
                  </div>
                  <button type="submit" className="btn btn-success w-100">
                    Deposit
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-purple-light">
              <div className="card-body">
                <h5>Withdraw Money</h5>
                <form onSubmit={handleWithdraw}>
                  <div className="form-group">
                    <label>Amount *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      max={savings?.currentAmount || 0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reason (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      placeholder="e.g., Emergency expense"
                    />
                  </div>
                  <button type="submit" className="btn btn-warning w-100">
                    Withdraw
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info">
          <strong>Auto-Savings:</strong> 10% of every income you add is automatically deposited to your savings account.
          <br /><br />
          <strong>Smart Withdrawals:</strong> Get personalized financial advice every time you withdraw from your savings.
        </div>

        {/* Transaction History */}
        <h4>Recent Transactions</h4>
        {!savings?.transactions || savings.transactions.length === 0 ? (
          <p>No transactions yet. Make your first deposit!</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {savings.transactions.slice(0, 20).map((txn: any, index: number) => {
                  // Calculate balance after transaction
                  const balanceAfter = savings.transactions
                    .slice(0, index + 1)
                    .reduce((sum: number, t: any) => {
                      return t.type === 'deposit' ? sum + t.amount : sum - t.amount;
                    }, 0);

                  return (
                    <tr key={index}>
                      <td>{formatLocalDate(txn.date)}</td>
                      <td>
                        <span className={`badge ${txn.type === 'deposit' ? 'badge-success' : 'badge-warning'}`}>
                          {txn.type === 'deposit' ? '💰 Deposit' : '💸 Withdrawal'}
                        </span>
                      </td>
                      <td className={txn.type === 'deposit' ? 'text-success' : 'text-danger'}>
                        {txn.type === 'deposit' ? '+' : '-'}{currencySymbol}{txn.amount.toFixed(2)}
                      </td>
                      <td>{txn.reason || '-'}</td>
                      <td><strong>{currencySymbol}{balanceAfter.toFixed(2)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {savings?.transactions && savings.transactions.length > 0 && (
          <div className="card mt-4 bg-purple-light">
            <div className="card-body">
              <h5>Summary</h5>
              <div className="row">
                <div className="col-md-4 text-center">
                  <strong>Total Deposits</strong>
                  <h4 className="text-success">
                    {currencySymbol}{savings.transactions
                      .filter((t: any) => t.type === 'deposit')
                      .reduce((sum: number, t: any) => sum + t.amount, 0)
                      .toFixed(2)}
                  </h4>
                </div>
                <div className="col-md-4 text-center">
                  <strong>Total Withdrawals</strong>
                  <h4 className="text-warning">
                    {currencySymbol}{savings.transactions
                      .filter((t: any) => t.type === 'withdrawal')
                      .reduce((sum: number, t: any) => sum + t.amount, 0)
                      .toFixed(2)}
                  </h4>
                </div>
                <div className="col-md-4 text-center">
                  <strong>Net Savings</strong>
                  <h4 className="text-purple">
                    {currencySymbol}{savings.currentAmount.toFixed(2)}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Savings;
