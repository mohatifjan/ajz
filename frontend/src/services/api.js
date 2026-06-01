import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', { refreshToken })
};

export const productAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  updateStock: (id, data) => apiClient.patch(`/products/${id}/stock`, data),
  getLowStock: () => apiClient.get('/products/low-stock'),
  delete: (id) => apiClient.delete(`/products/${id}`)
};

export const customerAPI = {
  getAll: (params) => apiClient.get('/customers', { params }),
  getById: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
  getTopCustomers: (params) => apiClient.get('/customers/analytics/top-customers', { params }),
  getOverduePayments: (params) => apiClient.get('/customers/analytics/overdue-payments', { params }),
  delete: (id) => apiClient.delete(`/customers/${id}`)
};

export const orderAPI = {
  getAll: (params) => apiClient.get('/orders', { params }),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  updateStatus: (id, data) => apiClient.patch(`/orders/${id}/status`, data),
  recordPayment: (id, data) => apiClient.post(`/orders/${id}/payment`, data),
  delete: (id) => apiClient.delete(`/orders/${id}`)
};

export const invoiceAPI = {
  getAll: (params) => apiClient.get('/invoices', { params }),
  getByNumber: (invoiceNumber) => apiClient.get(`/invoices/${invoiceNumber}`),
  search: (params) => apiClient.get('/invoices', { params }),
  getCustomers: () => apiClient.get('/invoices/customers'),
  getOrdersForCustomer: (customerId) => apiClient.get(`/invoices/customer/${customerId}/orders`)
};

export const ledgerAPI = {
  getCustomerLedger: (customerId, params) => apiClient.get(`/ledger/customer/${customerId}`, { params }),
  getAgingReport: (customerId) => apiClient.get(`/ledger/customer/${customerId}/aging`),
  getAllCustomersAging: (params) => apiClient.get(`/ledger/aging/all`, { params }),
  getCustomerStatement: (customerId, params) => apiClient.get(`/ledger/customer/${customerId}/statement`, { params }),
  reconcileLedger: (customerId, ledgerIds) => apiClient.patch(`/ledger/customer/${customerId}/reconcile`, { ledgerIds }),
  createEntry: (customerId, data) => apiClient.post(`/ledger/customer/${customerId}/entry`, data),
  updateEntry: (customerId, ledgerId, data) => apiClient.patch(`/ledger/customer/${customerId}/entry/${ledgerId}`, data)
};

export const auditAPI = {
  getAudits: (params) => apiClient.get('/inventory/audits', { params }),
  createAudit: (data) => apiClient.post('/inventory/audits', data),
  approveAudit: (id, data) => apiClient.patch(`/inventory/audits/${id}/approve`, data)
};

export const dashboardAPI = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getSalesOverview: (params) => apiClient.get('/dashboard/sales-overview', { params }),
  getRevenueMetrics: () => apiClient.get('/dashboard/revenue'),
  getCustomerIntelligence: () => apiClient.get('/dashboard/customers'),
  getInventoryOverview: () => apiClient.get('/dashboard/inventory'),
  getSalesAnalytics: () => apiClient.get('/dashboard/analytics'),
  getSalesReports: (params) => apiClient.get('/dashboard/reports/sales', { params }),
  getProfitLossReport: (params) => apiClient.get('/dashboard/reports/profit-loss', { params }),
  getCustomerOutstandingReports: (params) => apiClient.get('/dashboard/reports/customer-outstanding', { params }),
  getInventoryValuationReports: (params) => apiClient.get('/dashboard/reports/inventory-valuation', { params })
};

export const userAPI = {
  getAll: (params) => apiClient.get('/users', { params }),
  getById: (id) => apiClient.get(`/users/${id}`),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  changePassword: (data) => apiClient.put('/users/change-password', data),
  deactivate: (id) => apiClient.patch(`/users/${id}/deactivate`),
  delete: (id) => apiClient.delete(`/users/${id}`)
};

export const inventoryAPI = {
  getMovements: (params) => apiClient.get('/inventory/movements', { params }),
  getByProduct: (productId) => apiClient.get(`/inventory/product/${productId}`),
  approveMovement: (id, data) => apiClient.patch(`/inventory/movements/${id}/approve`, data),
  getSummary: () => apiClient.get('/inventory/summary')
};

export const supplierAPI = {
  getAll: (params) => apiClient.get('/suppliers', { params }),
  getById: (id) => apiClient.get(`/suppliers/${id}`),
  create: (data) => apiClient.post('/suppliers', data),
  update: (id, data) => apiClient.put(`/suppliers/${id}`, data),
  delete: (id) => apiClient.delete(`/suppliers/${id}`)
};

export const purchaseOrderAPI = {
  getAll: (params) => apiClient.get('/purchase-orders', { params }),
  getById: (id) => apiClient.get(`/purchase-orders/${id}`),
  create: (data) => apiClient.post('/purchase-orders', data),
  updateStatus: (id, data) => apiClient.patch(`/purchase-orders/${id}/status`, data),
  recordPayment: (id, data) => apiClient.post(`/purchase-orders/${id}/payment`, data),
  delete: (id) => apiClient.delete(`/purchase-orders/${id}`)
};

export const branchAPI = {
  getAll: (params) => apiClient.get('/branches', { params }),
  getById: (id) => apiClient.get(`/branches/${id}`),
  create: (data) => apiClient.post('/branches', data),
  update: (id, data) => apiClient.put(`/branches/${id}`, data),
  delete: (id) => apiClient.delete(`/branches/${id}`)
};

export const exportAPI = {
  downloadSalesReport: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `${apiClient.defaults.baseURL}/exports/sales-report?${queryString}`;
  },
  downloadProfitLossReport: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `${apiClient.defaults.baseURL}/exports/profit-loss-report?${queryString}`;
  },
  downloadCustomerOutstandingReport: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `${apiClient.defaults.baseURL}/exports/customer-outstanding-report?${queryString}`;
  },
  downloadInventoryValuationReport: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `${apiClient.defaults.baseURL}/exports/inventory-valuation-report?${queryString}`;
  },
  downloadInvoice: (invoiceId, format = 'pdf') => {
    window.location.href = `${apiClient.defaults.baseURL}/exports/invoice?invoiceId=${invoiceId}&format=${format}`;
  }
};

export const auditLogAPI = {
  getLogs: (params) => apiClient.get('/audit', { params }),
  getStatistics: () => apiClient.get('/audit/statistics')
};

export const backupAPI = {
  list: () => apiClient.get('/backup/list'),
  getStatus: () => apiClient.get('/backup/status'),
  create: (data) => apiClient.post('/backup/create', data),
  restore: (data) => apiClient.post('/backup/restore', data),
  delete: (backupName) => apiClient.delete(`/backup/${backupName}`),
  schedule: (data) => apiClient.post('/backup/schedule', data),
  exportJson: () => apiClient.get('/backup/export/json', { responseType: 'blob' })
};

export const barcodeAPI = {
  generateProductBarcode: (productId, params) => apiClient.get(`/barcode/product/${productId}/barcode`, { params, responseType: 'blob' }),
  generateQRCode: (productId, params) => apiClient.get(`/barcode/product/${productId}/qrcode`, { params }),
  generateBulkBarcodes: (productIds) => apiClient.post('/barcode/bulk', { productIds }),
  scanBarcode: (barcode) => apiClient.post('/barcode/scan', { barcode }),
  updateProductBarcode: (productId, barcode) => apiClient.patch(`/barcode/product/${productId}/update`, { barcode }),
  getStatistics: () => apiClient.get('/barcode/statistics')
};

export default apiClient;
