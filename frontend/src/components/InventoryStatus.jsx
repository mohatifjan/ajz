import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function InventoryStatus({ data }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{data?.totalProducts || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{data?.totalCategories || 0}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm font-medium text-gray-700 mb-2">Stock Valuation</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cost Value:</span>
              <span className="font-semibold text-gray-800">Rs. {data?.stockValuation?.totalValue?.toFixed(2) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Retail Value:</span>
              <span className="font-semibold text-gray-800">Rs. {data?.stockValuation?.retailValue?.toFixed(2) || 0}</span>
            </div>
          </div>
        </div>

        {data?.lowStockItems && data.lowStockItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="text-amber-600 mr-2 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-amber-900">Low Stock Items</p>
                <p className="text-sm text-amber-700 mt-1">{data.lowStockItems.length} items below reorder level</p>
              </div>
            </div>
          </div>
        )}

        {data?.fastMovingItems && data.fastMovingItems.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Fast Moving Items</h3>
            <div className="space-y-2">
              {data.fastMovingItems.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-green-600">{item.quantity} units</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.slowMovingItems && data.slowMovingItems.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Slow Moving Items</h3>
            <div className="space-y-2">
              {data.slowMovingItems.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-rose-50 rounded text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-rose-600">{item.quantitySold} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
