import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import '../styles/Theme.css';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [bankBalance, setBankBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Export form state
  const [showExportForm, setShowExportForm] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Manual expense form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    amount: '',
    category: 'Food',
    merchant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash'
  });

  const categories = ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Rent', 'EMI', 'Others'];
  const paymentMethods = ['Cash', 'Card', 'UPI', 'Net Banking', 'Others'];

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchExpenses();
    fetchBankBalance();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getAll();
      setExpenses(response.data.expenses || []);
    } catch (err: any) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankBalance = async () => {
    try {
      const BANK_API_URL = process.env.REACT_APP_BANK_API_URL || 'http://localhost:3002';
      const response = await axios.get(`${BANK_API_URL}/api/bank/transactions`);
      if (response.data.success) {
        setBankBalance(response.data.data.balance);
      }
    } catch (err: any) {
      console.log('Bank balance not available');
    }
  };

  const handleImportFromBank = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Call the bank import endpoint
      const response = await axios.post(`${API_URL}/bank/import`, {}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      const result = response.data.data;
      setMessage(
        `Import completed! ${result.imported} new expenses imported, ` +
        `${result.duplicates} duplicates skipped` +
        (result.categorized > 0 ? `, ${result.categorized} auto-categorized` : '')
      );

      // Refresh the expense list and bank balance
      fetchExpenses();
      fetchBankBalance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import from bank. Make sure the bank server is running on port 3002.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseAPI.delete(id);
        setMessage('Expense deleted successfully!');
        fetchExpenses();
      } catch (err: any) {
        setError('Failed to delete expense');
      }
    }
  };

  const handleEditClick = (expense: any) => {
    setEditingId(expense._id);
    setEditFormData({
      amount: expense.amount,
      category: expense.category,
      merchant: expense.merchant,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
  };

  const handleEditSave = async (id: string) => {
    try {
      await axios.put(`${API_URL}/expenses/${id}`, {
        ...editFormData,
        amount: parseFloat(editFormData.amount)
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      setMessage('Expense updated successfully!');
      setEditingId(null);
      fetchExpenses();
    } catch (err: any) {
      setError('Failed to update expense');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleManualExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');

      if (!manualFormData.amount || parseFloat(manualFormData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      await axios.post(`${API_URL}/expenses`, {
        ...manualFormData,
        amount: parseFloat(manualFormData.amount)
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      setMessage('Manual expense added successfully!');
      setShowManualForm(false);
      setManualFormData({
        amount: '',
        category: 'Food',
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash'
      });
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleExport = async () => {
    try {
      setError('');

      const requestData: any = {
        format: exportFormat
      };

      if (exportStartDate) requestData.startDate = exportStartDate;
      if (exportEndDate) requestData.endDate = exportEndDate;

      const response = await axios.post(`${API_URL}/expenses/export`, requestData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileExtension = exportFormat === 'excel' ? 'xlsx' : 'pdf';
      a.download = `expenses_${Date.now()}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage(`Expenses exported successfully as ${exportFormat.toUpperCase()}!`);
      setShowExportForm(false);
    } catch (err: any) {
      setError('Failed to export expenses');
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currencySymbol = getCurrencySymbol(user?.currency);

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
          <h2>Expenses</h2>
          <p style={{ marginBottom: 0 }}>Manage, import and export your expenses</p>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {/* Bank Balance Display */}
          {bankBalance && expenses.length > 0 && (
            <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-4 text-center border-end border-light">
                    <h6 style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Opening Balance</h6>
                    <h3 style={{ marginBottom: 0 }}>{currencySymbol}{bankBalance.openingBalance?.toFixed(2)}</h3>
                  </div>
                  <div className="col-md-4 text-center border-end border-light">
                    <h6 style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Closing Balance</h6>
                    <h3 style={{ marginBottom: 0 }}>{currencySymbol}{bankBalance.closingBalance?.toFixed(2)}</h3>
                  </div>
                  <div className="col-md-4 text-center">
                    <h6 style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Currency</h6>
                    <h3 style={{ marginBottom: 0 }}>{bankBalance.currency}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-4">
            <button
              className="btn btn-primary btn-lg me-3"
              onClick={handleImportFromBank}
              disabled={loading}
              style={{ background: '#8b5cf6', border: 'none' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Importing...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-2"></i>
                  Import Expenses from Bank
                </>
              )}
            </button>
            <button
              className="btn btn-outline-primary btn-lg"
              onClick={() => setShowManualForm(!showManualForm)}
              disabled={loading}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Manual Expense
            </button>
            <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-info-circle me-1"></i>
              Import expenses from your bank statement or add them manually
            </p>
          </div>

          {/* Manual Expense Form */}
          {showManualForm && (
            <div className="card mb-4" style={{ background: '#f8f9fa' }}>
              <div className="card-body">
                <h5>Add Manual Expense</h5>
                <form onSubmit={handleManualExpenseSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Amount *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={manualFormData.amount}
                          onChange={(e) => setManualFormData({ ...manualFormData, amount: e.target.value })}
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Category *</label>
                        <select
                          className="form-control"
                          value={manualFormData.category}
                          onChange={(e) => setManualFormData({ ...manualFormData, category: e.target.value })}
                          required
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Merchant</label>
                        <input
                          type="text"
                          className="form-control"
                          value={manualFormData.merchant}
                          onChange={(e) => setManualFormData({ ...manualFormData, merchant: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Payment Method *</label>
                        <select
                          className="form-control"
                          value={manualFormData.paymentMethod}
                          onChange={(e) => setManualFormData({ ...manualFormData, paymentMethod: e.target.value })}
                          required
                        >
                          {paymentMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={manualFormData.date}
                          onChange={(e) => setManualFormData({ ...manualFormData, date: e.target.value })}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Description</label>
                        <input
                          type="text"
                          className="form-control"
                          value={manualFormData.description}
                          onChange={(e) => setManualFormData({ ...manualFormData, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      style={{ background: '#8b5cf6', border: 'none' }}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Add Expense
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowManualForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <h4 className="mt-4 mb-3">Your Expenses</h4>
          {loading && expenses.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">No expenses found. Click "Import Expenses from Bank" to get started!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Merchant</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense._id}>
                      {editingId === expense._id ? (
                        // Edit mode
                        <>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={editFormData.date}
                              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </td>
                          <td>
                            <select
                              className="form-control form-control-sm"
                              value={editFormData.category}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editFormData.merchant}
                              onChange={(e) => setEditFormData({ ...editFormData, merchant: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={editFormData.amount}
                              onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                              step="0.01"
                            />
                          </td>
                          <td>
                            <select
                              className="form-control form-control-sm"
                              value={editFormData.paymentMethod}
                              onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                            >
                              {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-1"
                              onClick={() => handleEditSave(expense._id)}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={handleEditCancel}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td>{formatDate(expense.date)}</td>
                          <td>
                            <span className="badge" style={{ background: '#8b5cf6', color: 'white' }}>
                              {expense.category}
                            </span>
                          </td>
                          <td>{expense.merchant || '-'}</td>
                          <td>{expense.description || '-'}</td>
                          <td>
                            <strong style={{ color: '#d32f2f' }}>
                              {currencySymbol}{expense.amount.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{expense.paymentMethod}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleEditClick(expense)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(expense._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Export Section */}
          {expenses.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '2px solid #e0e0e0' }}>
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowExportForm(!showExportForm)}
              >
                <i className="bi bi-upload me-2"></i>
                Export Expenses
              </button>

              {showExportForm && (
                <div className="card mt-3" style={{ background: '#f8f9fa' }}>
                  <div className="card-body">
                    <h5>Export Options</h5>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Format</label>
                          <select
                            className="form-control"
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                          >
                            <option value="excel">Excel</option>
                            <option value="pdf">PDF</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Start Date (Optional)</label>
                          <input
                            type="date"
                            className="form-control"
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>End Date (Optional)</label>
                          <input
                            type="date"
                            className="form-control"
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        className="btn btn-primary me-2"
                        onClick={handleExport}
                        style={{ background: '#8b5cf6', border: 'none' }}
                      >
                        <i className="bi bi-download me-2"></i>
                        Export as {exportFormat.toUpperCase()}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowExportForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
