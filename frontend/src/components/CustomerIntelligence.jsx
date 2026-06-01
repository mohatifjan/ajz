import React from 'react';

export default function CustomerIntelligence({ data }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Intelligence</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">Active B2B Customers</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{data?.activeCustomers || 0}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-700">High Outstanding Accounts</p>
            <p className="text-2xl font-bold text-amber-900 mt-2">{data?.highOutstandingBalances?.length || 0}</p>
          </div>
          <div className="bg-rose-50 rounded-lg p-4">
            <p className="text-sm text-rose-700">Overdue Aging (30/60/90+)</p>
            <p className="text-sm text-slate-900 mt-2">
              {data?.overdueAging?.['30_days'] || 0} / {data?.overdueAging?.['60_days'] || 0} / {data?.overdueAging?.['90_plus_days'] || 0}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Top Customers by Revenue</h3>
          <div className="space-y-2">
            {data?.topCustomers?.slice(0, 5).map((customer) => (
              <div key={customer._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{customer.companyName}</span>
                <span className="text-sm font-semibold text-blue-600">Rs. {customer.totalSpent.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Overdue Accounts</h3>
          <div className="space-y-2">
            {data?.overdueAccounts?.length > 0 ? (
              data.overdueAccounts.slice(0, 5).map((customer) => (
                <div key={customer._id} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{customer.companyName}</p>
                    <p className="text-xs text-red-600">{customer.overdueDays} days overdue</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">Rs. {customer.totalOutstanding.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No overdue accounts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
