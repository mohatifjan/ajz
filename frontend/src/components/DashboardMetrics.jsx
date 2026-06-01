import React from 'react';

export default function DashboardMetrics({ data }) {
  const metrics = [
    {
      label: 'Today\'s Sales',
      value: data?.todaySales?.totalSales || 0,
      format: 'currency',
      color: 'bg-blue-500'
    },
    {
      label: 'Total Outstanding',
      value: data?.totalOutstanding || 0,
      format: 'currency',
      color: 'bg-red-500'
    },
    {
      label: 'Active Customers',
      value: data?.activeCustomers || 0,
      format: 'number',
      color: 'bg-green-500'
    },
    {
      label: 'Active Products',
      value: data?.activeProducts || 0,
      format: 'number',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, idx) => (
        <div key={idx} className={`${metric.color} text-white rounded-lg shadow p-6`}>
          <p className="text-sm font-medium opacity-90">{metric.label}</p>
          <p className="text-3xl font-bold mt-2">
            {metric.format === 'currency' ? 'Rs. ' : ''}
            {metric.format === 'currency'
              ? metric.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : metric.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
