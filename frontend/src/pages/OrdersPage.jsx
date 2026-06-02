import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI, productAPI } from '../services/api';
import { Eye, Trash2, Plus, X } from 'lucide-react';

const initialOrderItem = {
  product: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  tax: 0
};

const initialOrderForm = {
  customer: '',
  paymentMethod: 'cash',
  notes: '',
  items: [initialOrderItem]
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialOrderForm);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [search]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderAPI.getAll({
        page: 1,
        limit: 50,
        search
      });
      setOrders(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ page: 1, limit: 100, status: 'active' });
      setCustomers(response.data.data);
    } catch (err) {
      console.warn('Could not load customers:', err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ page: 1, limit: 100, status: 'active' });
      setProducts(response.data.data);
    } catch (err) {
      console.warn('Could not load products:', err.message);
    }
  };

  const resetForm = () => {
    setFormData(initialOrderForm);
    setShowForm(false);
    setError(null);
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, initialOrderItem] });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((current) => {
      const updatedItems = [...current.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'tax'
          ? parseFloat(value) || 0
          : value
      };

      if (field === 'product') {
        const selected = products.find((p) => p._id === value);
        if (selected) {
          updatedItems[index].unitPrice = selected.sellingPrice || 0;
        }
      }

      return { ...current, items: updatedItems };
    });
  };

  const orderTotal = formData.items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    return sum + lineTotal - item.discount + item.tax;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await orderAPI.create({
        customer: formData.customer,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax
        }))
      });

      setOrders([response.data.data, ...orders]);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderAPI.delete(id);
        setOrders(orders.filter((o) => o._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">Create and manage wholesale plastic goods orders.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={20} />}
          {showForm ? 'Close Order Form' : 'New Order'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Order</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Total</label>
                Rs. {orderTotal.toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-5 items-end p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                    <select
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.tax}
                      onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Remove
                    </button>
                    <div className="text-sm text-slate-700">
                      Total: Rs. {(item.quantity * item.unitPrice - item.discount + item.tax).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={handleAddItem}
                className="px-5 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.customer?.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Rs. {parseFloat(order.summary?.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
