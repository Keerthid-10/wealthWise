import React, { useState, useEffect } from 'react';
import { budgetAPI, goalsAPI } from '../services/api';
import { getCurrentDate } from '../utils/dateUtils';
import '../styles/Theme.css';

const BudgetPlanner: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const [formData, setFormData] = useState({
    totalAmount: '',
    categoryBudgets: [
      { category: 'Food', amount: '' },
      { category: 'Transportation', amount: '' },
      { category: 'Entertainment', amount: '' },
      { category: 'Shopping', amount: '' }
    ]
  });

  useEffect(() => {
    fetchBudgets();
    checkBudgetStatus();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getAll();
      setBudgets(response.data.budgets || []);
    } catch (err: any) {
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const checkBudgetStatus = async () => {
    try {
      const response = await budgetAPI.checkStatus();
      setBudgetStatus(response.data);
    } catch (err) {
      console.error('Failed to check budget status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const today = getCurrentDate();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    try {
      const categoryBudgets = formData.categoryBudgets
        .filter(cb => cb.amount && parseFloat(cb.amount) > 0)
        .map(cb => ({
          category: cb.category,
          amount: parseFloat(cb.amount)
        }));

      if (editingBudget) {
        // Update existing budget
        await budgetAPI.update(editingBudget._id, {
          totalAmount: parseFloat(formData.totalAmount),
          categoryBudgets
        });
        setMessage('Budget updated successfully!');
      } else {
        // Create new budget
        await budgetAPI.create({
          type: 'monthly',
          totalAmount: parseFloat(formData.totalAmount),
          categoryBudgets,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true
        });
        setMessage('Budget created successfully!');
      }

      setShowForm(false);
      setEditingBudget(null);
      resetForm();
      fetchBudgets();
      checkBudgetStatus();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || (editingBudget ? 'Failed to update budget' : 'Failed to create budget'));
    }
  };

  const resetForm = () => {
    setFormData({
      totalAmount: '',
      categoryBudgets: [
        { category: 'Food', amount: '' },
        { category: 'Transportation', amount: '' },
        { category: 'Entertainment', amount: '' },
        { category: 'Shopping', amount: '' }
      ]
    });
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    
    // Create a map of all categories from the existing budget
    const existingCategories = budget.categoryBudgets || [];
    const defaultCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping'];
    
    // Combine default categories with any additional ones from the budget
    const allCategories = [...defaultCategories];
    existingCategories.forEach((cb: any) => {
      if (!allCategories.includes(cb.category)) {
        allCategories.push(cb.category);
      }
    });
    
    // Create form data with all categories
    const categoryBudgets = allCategories.map(category => ({
      category,
      amount: getCategoryAmount(existingCategories, category)
    }));
    
    setFormData({
      totalAmount: budget.totalAmount.toString(),
      categoryBudgets
    });
    setShowForm(true);
  };

  const getCategoryAmount = (categoryBudgets: any[], category: string) => {
    const found = categoryBudgets?.find(cb => cb.category === category);
    return found ? found.amount.toString() : '';
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
    setShowForm(false);
    resetForm();
    setError('');
    setMessage('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget? All budget-related savings withdrawals will be automatically restored.')) {
      try {
        const response = await budgetAPI.delete(id);
        let msg = response.data.message || 'Budget deleted successfully! All budget-related withdrawals have been automatically restored to your savings.';

        // Show updated savings info if available
        if (response.data.updatedSavings) {
          msg += ` Your current savings balance is ₹${response.data.updatedSavings.currentAmount.toFixed(2)}.`;
        }
        msg += ' Refresh the Savings page to see your updated balance.';

        setMessage(msg);
        fetchBudgets();
        checkBudgetStatus();
      } catch (err: any) {
        setError(err.response?.data?.errors?.[0] || 'Failed to delete budget');
      }
    }
  };

  const addCategoryBudget = () => {
    setFormData({
      ...formData,
      categoryBudgets: [...formData.categoryBudgets, { category: '', amount: '' }]
    });
  };

  const removeCategoryBudget = (index: number) => {
    const newCategoryBudgets = formData.categoryBudgets.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      categoryBudgets: newCategoryBudgets
    });
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>Monthly Budget Planner</h2>
          <p>Set your monthly budget and track your spending</p>
          <div className="alert alert-info">
            <small>
              <strong>Note:</strong> You can only have one active budget per month. You can edit your existing budget or create a new one for the next month.
              <br /><br />
              <strong>Automatic Restoration:</strong> When you delete a budget, ALL budget-related savings withdrawals are automatically restored back to your savings account.
            </small>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {budgetStatus && budgetStatus.exceeded && (
          <div className="alert alert-warning">
            <strong>₹ Budget Alert!</strong>
            <p>You have exceeded your budget by ₹{budgetStatus.exceededBy?.toFixed(2) || 0}</p>
            {budgetStatus.goalImpact && (
              <p className="mb-0">
                <em>This may affect your financial goal: {budgetStatus.goalImpact}</em>
              </p>
            )}
          </div>
        )}

        <button
          className="btn btn-primary mb-4"
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancel' : (budgets.length > 0 && budgets.some(b => b.isActive) ? '+ Create New Budget' : '+ Create Monthly Budget')}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="card p-4 mb-4 bg-purple-light">
            <h4>{editingBudget ? 'Edit Monthly Budget' : 'Create Monthly Budget'}</h4>

            <div className="form-group">
              <label>Total Monthly Budget Amount *</label>
              <input
                type="number"
                className="form-control"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                required
                step="0.01"
                min="0"
                placeholder="e.g., 50000"
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
              <h5 className="mb-0">Category Budgets (Optional)</h5>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={addCategoryBudget}
              >
                + Add Category
              </button>
            </div>
            {formData.categoryBudgets.map((cb, index) => (
              <div key={index} className="row mb-2 align-items-center">
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control"
                    value={cb.category}
                    onChange={(e) => {
                      const newCategoryBudgets = [...formData.categoryBudgets];
                      newCategoryBudgets[index].category = e.target.value;
                      setFormData({...formData, categoryBudgets: newCategoryBudgets});
                    }}
                    placeholder="Category name"
                  />
                </div>
                <div className="col-5">
                  <input
                    type="number"
                    className="form-control"
                    value={cb.amount}
                    onChange={(e) => {
                      const newCategoryBudgets = [...formData.categoryBudgets];
                      newCategoryBudgets[index].amount = e.target.value;
                      setFormData({...formData, categoryBudgets: newCategoryBudgets});
                    }}
                    placeholder="Amount"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger w-100"
                    onClick={() => removeCategoryBudget(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary mt-3">
              {editingBudget ? 'Update Budget' : 'Create Monthly Budget'}
            </button>
          </form>
        )}

        <h4>Your Budgets</h4>
        {loading ? (
          <p>Loading budgets...</p>
        ) : budgets.length === 0 ? (
          <p>No budgets found. Create your first budget!</p>
        ) : (
          <div className="row">
            {budgets.map((budget) => (
              <div key={budget._id} className="col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5>Monthly Budget</h5>
                    <p><strong>Total Amount:</strong> ₹{budget.totalAmount.toFixed(2)}</p>
                    <p><strong>Period:</strong> {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${budget.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {budget.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    {budget.categoryBudgets && budget.categoryBudgets.length > 0 && (
                      <>
                        <h6 className="mt-2">Category Budgets:</h6>
                        {budget.categoryBudgets.map((cb: any, idx: number) => (
                          <div key={idx}>
                            {cb.category}: ₹{cb.amount.toFixed(2)}
                          </div>
                        ))}
                      </>
                    )}

                    <div className="mt-3">
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleEdit(budget)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(budget._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetPlanner;
