import React, { useState, useEffect } from 'react';
import { dashboardAPI, exportAPI } from '../services/api';
import { Download, Calendar, TrendingUp, DollarSign, Package, Users, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState(null);
  const [profitLossReport, setProfitLossReport] = useState(null);
  const [customerOutstandingReport, setCustomerOutstandingReport] = useState(null);
  const [inventoryValuationReport, setInventoryValuationReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [reportPeriod, startDate, endDate]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params = {
        period: reportPeriod,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };

      const [salesRes, profitRes, customerRes, inventoryRes] = await Promise.all([
        dashboardAPI.getSalesReports(params),
        dashboardAPI.getProfitLossReport(params),
        dashboardAPI.getCustomerOutstandingReports(params),
        dashboardAPI.getInventoryValuationReports(params)
      ]);

      setSalesReport(salesRes.data);
      setProfitLossReport(profitRes.data);
      setCustomerOutstandingReport(customerRes.data);
      setInventoryValuationReport(inventoryRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSalesReport = async () => {
    try {
      setIsExporting(true);
      const params = {
        period: reportPeriod,
        format: exportFormat,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };
      exportAPI.downloadSalesReport(params);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportProfitLossReport = async () => {
    try {
      setIsExporting(true);
      const params = {
        period: reportPeriod,
        format: exportFormat,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };
      exportAPI.downloadProfitLossReport(params);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCustomerOutstandingReport = async () => {
    try {
      setIsExporting(true);
      const params = {
        format: exportFormat
      };
      exportAPI.downloadCustomerOutstandingReport(params);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportInventoryValuationReport = async () => {
    try {
      setIsExporting(true);
      const params = {
        format: exportFormat
      };
      exportAPI.downloadInventoryValuationReport(params);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading reports: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive business intelligence and reporting dashboard.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="End Date"
          />
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </div>

      {/* Sales Reports */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={24} />
            Sales Reports
          </h2>
          <button
            onClick={exportSalesReport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesReport?.summary?.totalSales || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesReport?.summary?.totalOrders || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesReport?.summary?.averageOrderValue || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Period</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportPeriod}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesReport?.topProducts || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit & Loss Report */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign size={24} />
            Profit & Loss Report
          </h2>
          <button
            onClick={exportProfitLossReport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(profitLossReport?.revenue || 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(profitLossReport?.costOfGoodsSold || 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-3xl font-bold ${(profitLossReport?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profitLossReport?.netProfit || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit/Loss Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gross Profit</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(profitLossReport?.grossProfit || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${(profitLossReport?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profitLossReport?.netProfit || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(profitLossReport?.revenue || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">COGS</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(profitLossReport?.costOfGoodsSold || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Outstanding Reports */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users size={24} />
            Customer Outstanding Reports
          </h2>
          <button
            onClick={exportCustomerOutstandingReport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(customerOutstandingReport?.summary?.totalOutstanding || 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(customerOutstandingReport?.summary?.overdueAmount || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Outstanding by Customer</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {(customerOutstandingReport?.customers || []).map((customer, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(customer.outstanding)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(customer.overdue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.daysOverdue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Valuation Reports */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Package size={24} />
            Inventory Valuation Reports
          </h2>
          <button
            onClick={() => exportReport('inventory_valuation', inventoryValuationReport?.data || [])}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(inventoryValuationReport?.summary?.totalValue || 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-purple-600">
                {inventoryValuationReport?.summary?.totalItems || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Value by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryValuationReport?.byCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category }) => `${category || 'Other'}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalCostValue"
                >
                  {(inventoryValuationReport?.byCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Valued Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(inventoryValuationReport?.byCategory || []).slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.category || 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.averageCost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.totalCostValue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
