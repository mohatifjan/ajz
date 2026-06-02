import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { Edit, Trash2, Plus, X, Package } from 'lucide-react';

const initialProductForm = {
  sku: '',
  name: '',
  category: '',
  costPrice: '',
  sellingPrice: '',
  description: '',
  image: '',
  status: 'active',
  reorderLevel: 0
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getAll({
        page: 1,
        limit: 50,
        search,
        status: 'active'
      });
      setProducts(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialProductForm);
    setEditingProductId(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category || '',
      costPrice: product.costPrice || '',
      sellingPrice: product.sellingPrice || '',
      description: product.description || '',
      image: product.image || '',
      status: product.status || 'active',
      reorderLevel: product.stocks?.reorderLevel || 0
    });
    setEditingProductId(product._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...formData,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      stocks: {
        totalStock: 0,
        reorderLevel: parseInt(formData.reorderLevel, 10) || 0
      }
    };

    try {
      if (editingProductId) {
        const response = await productAPI.update(editingProductId, payload);
        setProducts(products.map((item) => (item._id === editingProductId ? response.data.data : item)));
      } else {
        const response = await productAPI.create(payload);
        setProducts([response.data.data, ...products]);
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        setProducts(products.filter((p) => p._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Inventory</h1>
          <p className="text-gray-600 mt-2">Manage AJZ stock, pricing, and reorder alerts.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={20} />}
          {showForm ? 'Close Form' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingProductId ? 'Edit Product' : 'New Product'}
          </h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                placeholder="..."
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Image URL (Thumbnail)</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                placeholder="https://example.com/image.png"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingProductId ? 'Update Product' : 'Create Product'}
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
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Image</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Cost Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Selling Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-blue-50/30 transition-all group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-gray-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{product.sku}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                    <div className="text-[11px] text-gray-400">{product.category?.name || 'Uncategorized'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">Rs. {parseFloat(product.costPrice).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Rs. {parseFloat(product.sellingPrice).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={product.stocks.totalStock <= product.stocks.reorderLevel ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {product.stocks.totalStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
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
