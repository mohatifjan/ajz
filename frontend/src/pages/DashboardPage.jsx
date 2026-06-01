import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import DashboardMetrics from '../components/DashboardMetrics';
import SalesChart from '../components/SalesChart';
import CustomerIntelligence from '../components/CustomerIntelligence';
import InventoryStatus from '../components/InventoryStatus';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [summary, revenue, customers, inventory, sales] = await Promise.all([
          dashboardAPI.getSummary(),
          dashboardAPI.getRevenueMetrics(),
          dashboardAPI.getCustomerIntelligence(),
          dashboardAPI.getInventoryOverview(),
          dashboardAPI.getSalesAnalytics()
        ]);

        setDashboardData({
          summary: summary.data.data,
          revenue: revenue.data.data,
          customers: customers.data.data,
          inventory: inventory.data.data,
          sales: sales.data.data
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  const cashBreakdown = dashboardData?.revenue?.paymentMethodBreakdown || [];
  const cashSales = cashBreakdown.find((item) => item._id === 'cash')?.amount || 0;
  const creditSales = cashBreakdown.reduce(
    (sum, item) => (item._id === 'cash' ? sum : sum + item.amount),
    0
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time insights and analytics for AJZ</p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {dashboardData?.summary && (
          <DashboardMetrics data={dashboardData.summary} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                Rs. {(dashboardData.revenue.totalRevenue?.totalRevenue || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Gross Profit</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                Rs. {(dashboardData.revenue.totalRevenue?.totalProfit || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Outstanding Receivables</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                Rs. {(dashboardData.revenue.outstandingReceivables?.totalOutstanding || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Revenue Last 30 Days</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                Rs. {(dashboardData.revenue.revenueLastMonth?.revenue || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">Cash Sales</p>
              <p className="text-xl font-semibold text-blue-900 mt-2">Rs. {cashSales.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-indigo-700">Credit & Other Sales</p>
              <p className="text-xl font-semibold text-indigo-900 mt-2">Rs. {creditSales.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
            </div>
          </div>
        </div>
        {dashboardData?.sales && (
          <SalesChart data={dashboardData.sales} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData?.customers && (
          <CustomerIntelligence data={dashboardData.customers} />
        )}
        {dashboardData?.inventory && (
          <InventoryStatus data={dashboardData.inventory} />
        )}
      </div>
    </div>
  );
}
