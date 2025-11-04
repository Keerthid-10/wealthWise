import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { getStartOfMonth, getEndOfMonth, getMonthsAgo } from '../utils/dateUtils';
import { useAuth } from '../utils/AuthContext';
import '../styles/Theme.css';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<any>(null);
  const [patterns, setPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const startDate = getMonthsAgo(1);
      const endDate = new Date();

      const [insightsRes, patternsRes] = await Promise.all([
        analyticsAPI.getInsights(),
        analyticsAPI.getPatterns(startDate.toISOString(), endDate.toISOString())
      ]);

      setInsights(insightsRes.data.insights);
      setPatterns(patternsRes.data.patterns);
    } catch (err: any) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="card">
          <p>Loading reports and insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={fetchReports}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>Financial Reports & Insights</h2>
          <p>Analyze your spending patterns, trends, and financial health</p>
          <button className="btn btn-primary" onClick={fetchReports}>
            Refresh Reports
          </button>
        </div>

        {/* Monthly Overview Cards */}
        {insights && (
          <div>
            <h4>Monthly Overview</h4>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h6 className="text-muted">Total Income</h6>
                    <h3 className="text-success">{currencySymbol}{insights.totalIncome?.toFixed(2) || '0.00'}</h3>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h6 className="text-muted">Total Expenses</h6>
                    <h3 className="text-danger">{currencySymbol}{insights.totalExpenses?.toFixed(2) || '0.00'}</h3>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h6 className="text-muted">Net Savings</h6>
                    <h3 className="text-purple">{currencySymbol}{insights.netSavings?.toFixed(2) || '0.00'}</h3>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h6 className="text-muted">Savings Rate</h6>
                    <h3 className="text-info">{insights.savingsRate || 0}%</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Highest Spending Category */}
            {insights.highestSpendingCategory && (
              <div className="alert alert-warning">
                <strong>Highest Spending Category:</strong> {insights.highestSpendingCategory}
                <br />
                <strong>Amount:</strong> {currencySymbol}{insights.highestSpendingAmount?.toFixed(2)}
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="card mb-4 bg-purple-light">
                <div className="card-body">
                  <h5>Personalized Recommendations</h5>
                  <ul>
                    {insights.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spending Patterns by Category */}
        {patterns && patterns.byCategory && Object.keys(patterns.byCategory).length > 0 && (
          <div className="mb-4">
            <h4>Spending by Category</h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Spent</th>
                    <th>Transactions</th>
                    <th>Average per Transaction</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(patterns.byCategory)
                    .sort(([, a]: any, [, b]: any) => b.total - a.total)
                    .map(([category, data]: [string, any]) => {
                      const percentage = patterns.total > 0
                        ? ((data.total / patterns.total) * 100).toFixed(1)
                        : 0;

                      return (
                        <tr key={category}>
                          <td>
                            <span className="badge badge-primary">{category}</span>
                          </td>
                          <td><strong>{currencySymbol}{data.total.toFixed(2)}</strong></td>
                          <td>{data.count}</td>
                          <td>{currencySymbol}{(data.total / data.count).toFixed(2)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{percentage}%</span>
                              <div className="progress flex-grow-1" style={{height: '20px'}}>
                                <div
                                  className="progress-bar"
                                  style={{width: `${percentage}%`}}
                                  role="progressbar"
                                  aria-valuenow={Number(percentage)}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{currencySymbol}{patterns.total.toFixed(2)}</strong></td>
                    <td><strong>{patterns.count}</strong></td>
                    <td><strong>{currencySymbol}{patterns.averagePerDay?.toFixed(2) || '0.00'}/day</strong></td>
                    <td><strong>100%</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Spending by Merchant */}
        {patterns && patterns.byMerchant && Object.keys(patterns.byMerchant).length > 0 && (
          <div className="mb-4">
            <h4>Top Merchants</h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Total Spent</th>
                    <th>Transactions</th>
                    <th>Average</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(patterns.byMerchant)
                    .sort(([, a]: any, [, b]: any) => b.total - a.total)
                    .slice(0, 10)
                    .map(([merchant, data]: [string, any]) => (
                      <tr key={merchant}>
                        <td>{merchant}</td>
                        <td><strong>{currencySymbol}{data.total.toFixed(2)}</strong></td>
                        <td>{data.count}</td>
                        <td>{currencySymbol}{(data.total / data.count).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spending by Date */}
        {patterns && patterns.byDate && Object.keys(patterns.byDate).length > 0 && (
          <div className="mb-4">
            <h4>Daily Spending Trend</h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Spent</th>
                    <th>Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(patterns.byDate)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .slice(0, 15)
                    .map(([date, data]: [string, any]) => (
                      <tr key={date}>
                        <td>{new Date(date).toLocaleDateString()}</td>
                        <td><strong>{currencySymbol}{data.total.toFixed(2)}</strong></td>
                        <td>{data.count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <h5>Average Daily Spending</h5>
                <h2 className="text-purple">{currencySymbol}{patterns?.averagePerDay?.toFixed(2) || '0.00'}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <h5>Total Transactions</h5>
                <h2 className="text-info">{patterns?.count || 0}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {/* <div className="text-center mt-4">
          <button className="btn btn-primary" onClick={fetchReports}>
            Refresh Reports
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default Reports;
