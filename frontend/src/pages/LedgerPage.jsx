import React, { useState, useEffect } from 'react';
import { ledgerAPI, exportAPI } from '../services/api';
import { Download, FileText, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90', '#87CEEB'];

export default function LedgerPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [agingReport, setAgingReport] = useState(null);
  const [allCustomersAging, setAllCustomersAging] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ledger');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statuses, setStatuses] = useState([]);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    fetchAllCustomersAging();
  }, []);

  const fetchAllCustomersAging = async () => {
    try {
      setIsLoading(true);
      const res = await ledgerAPI.getAllCustomersAging();
      if (res.data.success) {
        setAllCustomersAging(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedCustomer(res.data.data[0]);
          fetchCustomerLedger(res.data.data[0].customerId);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch aging report');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerLedger = async (customerId, pageNum = 1) => {
    try {
      setIsLoading(true);
      const params = { page: pageNum, limit: 20, status: statuses.length > 0 ? statuses.join(',') : undefined };
      const res = await ledgerAPI.getCustomerLedger(customerId, params);

      if (res.data.success) {
        setLedger(res.data.data.ledger);
        setPage(res.data.data.pagination.page);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgingReport = async (customerId) => {
    try {
      const res = await ledgerAPI.getAgingReport(customerId);
      if (res.data.success) {
        setAgingReport(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch aging report');
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setPage(1);
    fetchCustomerLedger(customer.customerId);
    fetchAgingReport(customer.customerId);
  };

  const downloadStatement = async () => {
    try {
      if (!selectedCustomer) return;
      const res = await ledgerAPI.getCustomerStatement(selectedCustomer.customerId);
      if (res.data.success) {
        const statement = res.data.data;
        let htmlContent = `
          <html>
          <head>
            <title>Customer Statement - ${statement.customer.companyName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .customer-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #366092; color: white; }
              .total { font-weight: bold; background-color: #f0f0f0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AJ Traders - Customer Statement</h1>
              <h2>${statement.customer.companyName}</h2>
            </div>
            <div class="customer-info">
              <p><strong>Email:</strong> ${statement.customer.email}</p>
              <p><strong>Phone:</strong> ${statement.customer.phone}</p>
              <p><strong>GST:</strong> ${statement.customer.gstNumber}</p>
              <p><strong>Credit Limit:</strong> ${statement.customer.creditLimit}</p>
              <p><strong>Available Credit:</strong> ${statement.customer.availableCredit}</p>
              <p><strong>Period:</strong> ${statement.periodStart} to ${statement.periodEnd}</p>
            </div>
            <table>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
              ${statement.statement.map(row => `
                <tr>
                  <td>${row.date}</td>
                  <td>${row.description}</td>
                  <td>${row.reference}</td>
                  <td>${row.debit}</td>
                  <td>${row.credit}</td>
                  <td>${row.balance}</td>
                  <td>${row.status}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="4"></td>
                <td colspan="2">Closing Balance: ${statement.closingBalance}</td>
              </tr>
            </table>
            <p style="text-align: center; color: #666; font-size: 12px;">Generated: ${statement.generatedDate}</p>
          </body>
          </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statement_${selectedCustomer.companyName}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to download statement');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);
  };

  if (isLoading && allCustomersAging.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading ledger data...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Credit Ledger & Aging Report</h1>
        <p className="text-gray-600 mt-2">Customer payment tracking and account aging analysis.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {allCustomersAging.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Customers with Outstanding</p>
                <p className="text-3xl font-bold text-gray-900">{allCustomersAging.length}</p>
              </div>
              <AlertCircle className="text-orange-500" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Outstanding</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(allCustomersAging.reduce((sum, c) => sum + c.totalOutstanding, 0))}
                </p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">90+ Days Overdue</p>
                <p className="text-3xl font-bold text-red-700">
                  {formatCurrency(allCustomersAging.reduce((sum, c) => sum + c.over_90, 0))}
                </p>
              </div>
              <AlertCircle className="text-red-700" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current & Due (30 Days)</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatCurrency(
                    allCustomersAging.reduce((sum, c) => sum + c.current + c['30_days'], 0)
                  )}
                </p>
              </div>
              <CheckCircle className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 font-medium border-b-2 ${activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Customer Ledger
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-4 py-2 font-medium border-b-2 ${activeTab === 'aging'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Aging Analysis
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 font-medium border-b-2 ${activeTab === 'summary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            All Customers
          </button>
        </div>
      </div>

      {/* Customer Selection */}
      {activeTab !== 'summary' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
          <select
            value={selectedCustomer?.customerId || ''}
            onChange={(e) => {
              const cust = allCustomersAging.find(c => c.customerId === e.target.value);
              if (cust) handleCustomerSelect(cust);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Customer --</option>
            {allCustomersAging.map((cust) => (
              <option key={cust.customerId} value={cust.customerId}>
                {cust.companyName} ({formatCurrency(cust.totalOutstanding)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && selectedCustomer && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.companyName}</h2>
              <p className="text-gray-600">Credit Limit: {formatCurrency(selectedCustomer.creditLimit)}</p>
              <p className="text-gray-600">Outstanding: {formatCurrency(selectedCustomer.totalOutstanding)}</p>
            </div>
            <button
              onClick={downloadStatement}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={16} />
              Download Statement
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Debit</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Credit</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Balance</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry._id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{entry.description}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.status === 'paid' ? 'bg-green-100 text-green-800' :
                        entry.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          entry.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchCustomerLedger(selectedCustomer.customerId, page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchCustomerLedger(selectedCustomer.customerId, page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aging Tab */}
      {activeTab === 'aging' && agingReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Aging Report</h3>
            <div className="space-y-3">
              {agingReport.agingReport.map((bucket) => (
                <div key={bucket.bucket} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{bucket.label}</p>
                    <p className="text-sm text-gray-600">{bucket.count} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(bucket.amount)}</p>
                    <p className="text-sm text-gray-600">{bucket.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Aging Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agingReport.agingReport}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {agingReport.agingReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">All Customers Aging Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Customer</th>
                  <th className="px-4 py-2 text-right font-semibold">Outstanding</th>
                  <th className="px-4 py-2 text-right font-semibold">Current</th>
                  <th className="px-4 py-2 text-right font-semibold">30 Days</th>
                  <th className="px-4 py-2 text-right font-semibold">60 Days</th>
                  <th className="px-4 py-2 text-right font-semibold">90 Days</th>
                  <th className="px-4 py-2 text-right font-semibold">90+ Days</th>
                </tr>
              </thead>
              <tbody>
                {allCustomersAging.map((customer) => (
                  <tr key={customer.customerId} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">{customer.companyName}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(customer.totalOutstanding)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer.current)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer['30_days'])}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer['60_days'])}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer['90_days'])}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-semibold">{formatCurrency(customer.over_90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
