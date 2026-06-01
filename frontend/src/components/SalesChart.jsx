import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function SalesChart({ data }) {
  const hasDailyTrend = data?.dailyTrend?.length > 0;
  const hasMonthlyTrend = data?.monthlyTrend?.length > 0;
  const hasProductPerformance = data?.productPerformance?.length > 0;

  if (!hasDailyTrend && !hasProductPerformance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Analytics</h2>
        <p className="text-gray-500">No sales analytics data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Analytics</h2>

      {hasDailyTrend && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Sales Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => `Rs. ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" dot={false} name="Sales" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasMonthlyTrend && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => `Rs. ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="sales" fill="#2563eb" name="Sales" />
              <Bar dataKey="profit" fill="#059669" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasProductPerformance && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Selling Products</h3>
          <div className="space-y-2">
            {data.productPerformance.slice(0, 5).map((item) => (
              <div key={item._id} className="flex justify-between items-center rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.productInfo?.[0]?.name || 'Unknown Product'}</p>
                  <p className="text-xs text-slate-500">SKU: {item.productInfo?.[0]?.sku || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="text-base font-semibold text-slate-900">Rs. {item.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
