import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { expenseAPI } from '../services/api';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/types';
import '../styles/Form.css';

const ImportExpenses: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    merchant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash'
  });
  const [jsonData, setJsonData] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await expenseAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
        currency: user?.currency
      });
      setMessage('Expense added successfully!');
      setFormData({
        amount: '',
        category: 'Food',
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash'
      });
    } catch (error: any) {
      setMessage('Failed to add expense: ' + (error.response?.data?.errors?.[0] || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJsonImport = async () => {
    setLoading(true);
    setMessage('');

    try {
      const expenses = JSON.parse(jsonData);
      const response = await expenseAPI.import(expenses);
      setMessage(`Imported ${response.data.imported} expenses successfully!`);
      setJsonData('');
    } catch (error: any) {
      setMessage('Failed to import: ' + (error.response?.data?.errors?.[0] || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container">
        <h1>Add Today's Expenses</h1>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        <div className="form-sections">
          <div className="form-section">
            <h3>Manual Entry</h3>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select className="form-control" name="category" value={formData.category} onChange={handleChange}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Merchant</label>
                <input
                  type="text"
                  className="form-control"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select className="form-control" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>

          <div className="form-section">
            <h3>Import from JSON</h3>
            <p>Paste your expense data in JSON format below:</p>
            <textarea
              className="form-control"
              rows={10}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='[{"amount": 100, "category": "Food", "merchant": "Store", "date": "2024-01-01"}]'
            />
            <button
              className="btn btn-secondary mt-3"
              onClick={handleJsonImport}
              disabled={loading || !jsonData}
            >
              {loading ? 'Importing...' : 'Import JSON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExpenses;
