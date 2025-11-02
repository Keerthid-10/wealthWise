import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 or 403, clear the session and redirect to login
    if (error.response?.status === 401 || error.response?.status === 403) {
      sessionStorage.removeItem('token');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  requestPasswordReset: (email: string) => api.post('/auth/password-reset/request', { email }),
  verifyOTP: (email: string, otp: string) => api.post('/auth/password-reset/verify-otp', { email, otp }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/password-reset/confirm', { email, otp, newPassword })
};

// Expense API
export const expenseAPI = {
  create: (data: any) => api.post('/expenses', data),
  import: (expenses: any[]) => api.post('/expenses/import', { expenses }),
  getAll: (params?: any) => api.get('/expenses', { params }),
  getDailySummary: (date?: string, currency?: string) =>
    api.get('/expenses/daily-summary', { params: { date, currency } }),
  getByCategory: (startDate: string, endDate: string, currency?: string) =>
    api.get('/expenses/by-category', { params: { startDate, endDate, currency } }),
  getByMerchant: (startDate: string, endDate: string, currency?: string) =>
    api.get('/expenses/by-merchant', { params: { startDate, endDate, currency } }),
  getHistorical: (currency?: string) => api.get('/expenses/historical', { params: { currency } }),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`)
};

// Income API
export const incomeAPI = {
  create: (data: any) => api.post('/income', data),
  getAll: (params?: any) => api.get('/income', { params }),
  getInsights: (date?: string, currency?: string) =>
    api.get('/income/insights', { params: { date, currency } }),
  update: (id: string, data: any) => api.put(`/income/${id}`, data),
  delete: (id: string) => api.delete(`/income/${id}`)
};

// Budget API
export const budgetAPI = {
  create: (data: any) => api.post('/budgets', data),
  getActive: () => api.get('/budgets/active'),
  checkStatus: (date?: string, currency?: string) =>
    api.get('/budgets/status', { params: { date, currency } }),
  getAll: () => api.get('/budgets'),
  update: (id: string, data: any) => api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`)
};

// Goals API
export const goalsAPI = {
  create: (data: any) => api.post('/goals', data),
  getAll: (status?: string) => api.get('/goals', { params: { status } }),
  updateProgress: (id: string, amount: number) => api.put(`/goals/${id}/progress`, { amount }),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`)
};

// Recurring Expenses API
export const recurringAPI = {
  create: (data: any) => api.post('/recurring-expenses', data),
  getAll: () => api.get('/recurring-expenses'),
  process: (date?: string) => api.post('/recurring-expenses/process', { date }),
  update: (id: string, data: any) => api.put(`/recurring-expenses/${id}`, data),
  delete: (id: string) => api.delete(`/recurring-expenses/${id}`)
};

// Savings API
export const savingsAPI = {
  getAccount: () => api.get('/savings'),
  deposit: (amount: number, reason?: string) => api.post('/savings/deposit', { amount, reason }),
  withdraw: (amount: number, reason?: string) => api.post('/savings/withdraw', { amount, reason }),
  reviewMonthly: (date?: string) => api.get('/savings/review', { params: { date } }),
  getSummary: () => api.get('/savings/summary'),
  restoreAll: () => api.post('/savings/restore-all')
};

// Analytics API
export const analyticsAPI = {
  getWeeklySummary: (date?: string, currency?: string) =>
    api.get('/analytics/weekly-summary', { params: { date, currency } }),
  getPatterns: (startDate: string, endDate: string, currency?: string) =>
    api.get('/analytics/patterns', { params: { startDate, endDate, currency } }),
  getInsights: (date?: string, currency?: string) =>
    api.get('/analytics/insights', { params: { date, currency } }),
  getDashboard: (date?: string, currency?: string) =>
    api.get('/analytics/dashboard', { params: { date, currency } })
};

// Export API
export const exportAPI = {
  exportExpenses: (format: string, startDate?: string, endDate?: string, currency?: string) =>
    api.post('/expenses/export', { format, startDate, endDate }, {
      params: { currency },
      responseType: 'blob'
    })
};

// Reminders API
export const remindersAPI = {
  getReminders: (date?: string) => api.get('/reminders', { params: { date } })
};

export default api;
