import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if the 401 was during login attempt
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.dispatchEvent(new CustomEvent('pos:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getCategories: () => api.get('/products/categories'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
};

export const couponAPI = {
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
  toggleStatus: (id) => api.put(`/coupons/${id}/toggle`),
  delete: (id) => api.delete(`/coupons/${id}`),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateStore: (data) => api.put('/auth/store', data),
  logout: () => api.post('/auth/logout'),
};

export const dashboardAPI = {
  getStats: (timeframe = '7d') => api.get('/dashboard/stats', { params: { timeframe } }),
};

export const seedAPI = {
  resetData: () => api.post('/seed/reset'),
  checkHealth: () => api.get('/health'),
};

export const documentAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  convertToInvoice: (id, data) => api.post(`/documents/${id}/convert-to-invoice`, data),
  getPdfUrl: (id) => `${API_BASE_URL}/documents/${id}/pdf`,
  dispatch: (id, data) => api.post(`/documents/${id}/dispatch`, data),
};

export const inventoryAdvancedAPI = {
  getLowStockAndExpiry: (days = 60) => api.get('/inventory-advanced/low-stock-and-expiry', { params: { days } }),
  createAdjustment: (data) => api.post('/inventory-advanced/adjustments', data),
  getAdjustments: (params) => api.get('/inventory-advanced/adjustments', { params }),
  exportCatalogUrl: () => `${API_BASE_URL}/inventory-advanced/export-catalog`,
  importCatalog: (items) => api.post('/inventory-advanced/import-catalog', { items }),
};

export const vendorAPI = {
  getAll: (params) => api.get('/vendors', { params }),
  create: (data) => api.post('/vendors', data),
  getLedger: (id) => api.get(`/vendors/${id}/ledger`),
  recordPayment: (id, data) => api.post(`/vendors/${id}/payment`, data),
};

export const purchaseAPI = {
  getBills: (params) => api.get('/purchases/bills', { params }),
  createBill: (data) => api.post('/purchases/bills', data),
  getDebitNotes: (params) => api.get('/purchases/debit-notes', { params }),
  createDebitNote: (data) => api.post('/purchases/debit-notes', data),
};

export const ledgerAPI = {
  getCustomerLedger: (id) => api.get(`/ledger/customer/${id}`),
  recordPayment: (id, data) => api.post(`/ledger/customer/${id}/payment`, data),
  checkCredit: (id, amount) => api.get(`/ledger/check-credit/${id}`, { params: { amount } }),
  updateSettings: (id, data) => api.put(`/ledger/customer/${id}/settings`, data),
};

export const gstAPI = {
  getGSTR1: (params) => api.get('/gst/reports/gstr1', { params }),
  getGSTR2: (params) => api.get('/gst/reports/gstr2', { params }),
  getGSTR3B: (params) => api.get('/gst/reports/gstr3b', { params }),
  exportReportUrl: (type) => `${API_BASE_URL}/gst/reports/export/${type}`,
  generateEInvoiceStub: (data) => api.post('/gst/einvoice-eway/generate-stub', data),
};

export const financeAPI = {
  getAccounts: () => api.get('/finance/accounts'),
  createAccount: (data) => api.post('/finance/accounts', data),
  transferFunds: (data) => api.post('/finance/accounts/transfer', data),
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  createExpense: (data) => api.post('/finance/expenses', data),
  getCheques: (params) => api.get('/finance/cheques', { params }),
  createCheque: (data) => api.post('/finance/cheques', data),
  updateChequeStatus: (id, data) => api.put(`/finance/cheques/${id}/status`, data),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
};

export default api;
