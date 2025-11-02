import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { analyticsAPI, expenseAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [merchantData, setMerchantData] = useState<any[]>([]);
  const [dateData, setDateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'category' | 'date' | 'merchant'>('category');

  const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff'];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [dashResponse, categoryResponse, merchantResponse, patternsResponse] = await Promise.all([
        analyticsAPI.getDashboard(today.toISOString(), user?.currency),
        expenseAPI.getByCategory(
          startOfMonth.toISOString(),
          endOfMonth.toISOString(),
          user?.currency
        ),
        expenseAPI.getByMerchant(
          startOfMonth.toISOString(),
          endOfMonth.toISOString(),
          user?.currency
        ),
        analyticsAPI.getPatterns(
          startOfMonth.toISOString(),
          endOfMonth.toISOString(),
          user?.currency
        )
      ]);

      setDashboardData(dashResponse.data.dashboard);

      // Format category data for charts
      const catData = Object.entries(categoryResponse.data.categoryData).map(
        ([category, data]: [string, any]) => ({
          name: category,
          value: data.total,
          count: data.count
        })
      );
      setCategoryData(catData);

      // Format merchant data
      const merchData = Object.entries(merchantResponse.data.merchantData)
        .map(([merchant, data]: [string, any]) => ({
          name: merchant,
          value: data.total,
          count: data.count
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setMerchantData(merchData);

      // Format date data for line chart
      if (patternsResponse.data.patterns.byDate) {
        const dateDataFormatted = Object.entries(patternsResponse.data.patterns.byDate)
          .map(([date, data]: [string, any]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: data.total,
            count: data.count
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-15); // Last 15 days
        setDateData(dateDataFormatted);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-purple" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your financial dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger">{error}</div>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2>Financial Dashboard</h2>
            <p>Your complete financial overview and analytics</p>
          </div>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {dashboardData?.insights && (
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card text-center bg-purple-light h-100">
                <div className="card-body">
                  <h6 className="text-muted">Total Income</h6>
                  <h3 className="text-success">₹{dashboardData.insights.totalIncome?.toFixed(2) || '0.00'}</h3>
                  <small>This month</small>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card text-center bg-purple-light h-100">
                <div className="card-body">
                  <h6 className="text-muted">Total Expenses</h6>
                  <h3 className="text-danger">₹{dashboardData.insights.totalExpenses?.toFixed(2) || '0.00'}</h3>
                  <small>This month</small>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card text-center bg-purple-light h-100">
                <div className="card-body">
                  <h6 className="text-muted">Net Savings</h6>
                  <h3 className={dashboardData.insights.netSavings >= 0 ? 'text-success' : 'text-danger'}>
                    ₹{dashboardData.insights.netSavings?.toFixed(2) || '0.00'}
                  </h3>
                  <small>This month</small>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card text-center bg-purple-light h-100">
                <div className="card-body">
                  <h6 className="text-muted">Savings Rate</h6>
                  <h3 className="text-purple">{dashboardData.insights.savingsRate || 0}%</h3>
                  <small>Of income</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="mb-4">
          <div className="btn-group" role="group">
            <button
              className={`btn ${view === 'category' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setView('category')}
            >
              <i className="bi bi-pie-chart"></i> By Category
            </button>
            <button
              className={`btn ${view === 'merchant' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setView('merchant')}
            >
              <i className="bi bi-shop"></i> By Merchant
            </button>
            <button
              className={`btn ${view === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setView('date')}
            >
              <i className="bi bi-calendar-date"></i> By Date
            </button>
          </div>
        </div>

        {/* Charts Section */}
        {view === 'category' && categoryData.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5>Spending by Category</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ₹${entry.value.toFixed(0)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5>Category Breakdown</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8b5cf6" name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'merchant' && merchantData.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h5>Top 10 Merchants</h5>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={merchantData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#a78bfa" name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'date' && dateData.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h5>Daily Spending Trend (Last 15 Days)</h5>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Amount (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Highest Spending Category Alert */}
        {dashboardData?.insights?.highestSpendingCategory && (
          <div className="alert alert-warning mb-4">
            <strong>📊 Highest Spending Category:</strong> {dashboardData.insights.highestSpendingCategory}
            <br />
            <strong>Amount:</strong> ₹{dashboardData.insights.highestSpendingAmount?.toFixed(2)}
          </div>
        )}

        {/* Recommendations */}
        {dashboardData?.insights?.recommendations && dashboardData.insights.recommendations.length > 0 && (
          <div className="card mb-4">
            <div className="card-body bg-purple-light">
              <h5>💡 Personalized Recommendations</h5>
              <ul className="mb-0">
                {dashboardData.insights.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {categoryData.length === 0 && merchantData.length === 0 && (
          <div className="alert alert-info">
            <h5>No data available</h5>
            <p>Start adding expenses to see your financial analytics and insights!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
