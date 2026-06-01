import React, { useState, useEffect } from 'react';
import { productAPI, auditAPI } from '../services/api';
import { Plus, Archive } from 'lucide-react';

const initialForm = {
  productId: '',
  physicalCount: 0,
  remarks: ''
};

export default function StockAuditPage() {
  const [products, setProducts] = useState([]);
  const [audits, setAudits] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchAudits();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ page: 1, limit: 100, status: 'active' });
      setProducts(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const fetchAudits = async () => {
    try {
      const response = await auditAPI.getAudits({ page: 1, limit: 25 });
      setAudits(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await auditAPI.createAudit({
        productId: formData.productId,
        physicalCount: Number(formData.physicalCount),
        remarks: formData.remarks
      });
      setSuccess('Stock audit request created successfully.');
      setFormData(initialForm);
      fetchAudits();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Audit</h1>
          <p className="text-gray-600 mt-2">Log physical stock audits and reconcile system quantity discrepancies.</p>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Archive size={20} />
          <span>Audit approvals can be handled by admin and managers.</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">New stock audit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Physical Count</label>
              <input
                type="number"
                min="0"
                value={formData.physicalCount}
                onChange={(e) => setFormData({ ...formData, physicalCount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              <Plus size={16} />
              Submit audit
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent audits</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead>
                <tr>
                  <th className="border-b px-4 py-3">Product</th>
                  <th className="border-b px-4 py-3">System</th>
                  <th className="border-b px-4 py-3">Physical</th>
                  <th className="border-b px-4 py-3">Discrepancy</th>
                  <th className="border-b px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                      No audits logged yet.
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit._id} className="hover:bg-gray-50">
                      <td className="border-b px-4 py-3">{audit.product?.name || 'Unknown'}</td>
                      <td className="border-b px-4 py-3">{audit.systemCount}</td>
                      <td className="border-b px-4 py-3">{audit.physicalCount}</td>
                      <td className="border-b px-4 py-3">{audit.discrepancy}</td>
                      <td className="border-b px-4 py-3 capitalize">{audit.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
