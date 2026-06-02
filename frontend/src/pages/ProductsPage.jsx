import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import {
  Edit, Trash2, Plus, X, Package,
  LayoutGrid, List, Search, Filter,
  AlertTriangle, CheckCircle2, TrendingUp,
  Camera, Image as ImageIcon
} from 'lucide-react';

const initialProductForm = {
  sku: '',
  name: '',
  category: '',
  costPrice: '',
  sellingPrice: '',
  description: '',
  image: '',
  status: 'active',
  reorderLevel: 10
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [formData, setFormData] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState(null);

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stocks.totalStock <= (p.stocks.reorderLevel || 10)).length;
  const outOfStockCount = products.filter(p => p.stocks.totalStock === 0).length;

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getAll({
        page: 1,
        limit: 100,
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size too large. Please use an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
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
      category: product.category?._id || product.category || '',
      costPrice: product.costPrice || '',
      sellingPrice: product.sellingPrice || '',
      description: product.description || '',
      image: product.image || '',
      status: product.status || 'active',
      reorderLevel: product.stocks?.reorderLevel || 10
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
        reorderLevel: parseInt(formData.reorderLevel, 10) || 10
      }
    };

    try {
      if (editingProductId) {
        const response = await productAPI.update(editingProductId, payload);
        setProducts(products.map(item => item._id === editingProductId ? response.data.data : item));
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
    if (window.confirm('Delete this product permanently?')) {
      try {
        await productAPI.delete(id);
        setProducts(products.filter(p => p._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-10">
      {/* Ultra Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Inventory Cloud</h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">AJ Traders</span>
            <p className="text-slate-500 font-medium text-sm">Visualize and manage your global stock registry.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right duration-700">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={22} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={22} />
            </button>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 group"
          >
            {showForm ? <X size={20} /> : <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />}
            {showForm ? 'Cancel Operation' : 'Add New Product'}
          </button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: 'Stock Units', value: totalProducts, sub: 'Active Products', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Low Stock', value: lowStockCount, sub: 'Needs Reorder', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', pulse: true },
          { label: 'Depleted', value: outOfStockCount, sub: 'Zero Inventory', icon: X, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Efficiency', value: '99.4%', sub: 'System Health', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="relative z-10">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-900">{stat.value}</h3>
                <span className="text-[10px] font-bold text-slate-400">{stat.sub}</span>
              </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 p-8 rounded-full ${stat.bg} ${stat.color} opacity-20 group-hover:scale-125 transition-transform duration-700`}>
              <stat.icon size={64} strokeWidth={1} />
            </div>
            {stat.pulse && <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>}
          </div>
        ))}
      </div>

      {/* Smart Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-stretch">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
          <input
            type="text"
            placeholder="Search product metadata, SKU, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 shadow-sm text-lg"
          />
        </div>
        <button className="px-10 py-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-center gap-3 font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
          <Filter size={22} className="text-indigo-600" />
          Advanced Filters
        </button>
      </div>

      {/* Professional Form Overlay */}
      {showForm && (
        <div className="mb-12 bg-white rounded-[3rem] shadow-2xl border border-indigo-50 p-10 lg:p-16 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Package size={200} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {editingProductId ? 'Edit Product Entity' : 'Create Global Product'}
                </h2>
                <p className="text-slate-400 font-medium mt-1">Fill in the specification details below.</p>
              </div>
              <button onClick={resetForm} className="p-4 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-8 py-5 rounded-2xl mb-12 flex items-center gap-4 font-bold animate-bounce">
                <AlertTriangle size={24} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Media Section (NEW UPLOADER) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Visual Identity</label>
                  <div
                    onClick={() => document.getElementById('mainImageUpload').click()}
                    className="aspect-square bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group relative"
                  >
                    {formData.image ? (
                      <div className="w-full h-full relative">
                        <img src={formData.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
                        <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                          <Camera className="text-white mb-2 scale-150" size={32} />
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 space-y-4">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform group-hover:shadow-indigo-100">
                          <ImageIcon className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={32} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Upload Product Image</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Drag & Drop or Click</p>
                        </div>
                      </div>
                    )}
                    <input
                      id="mainImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-tighter">Recommended: 1080x1080px (Max 2MB)</p>
                </div>
              </div>

              {/* Info Section */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Stock Keeping Unit (SKU)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-black text-slate-800"
                    placeholder="E.G. AJZ-CAT-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Primary Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-black text-slate-800"
                    placeholder="Product Title"
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Story / Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium text-slate-700"
                    placeholder="Describe your product value prop..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Acquisition Cost (Rs)</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-black text-slate-800"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Retail MSRP (Rs)</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-black text-slate-800"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-black text-slate-800"
                    placeholder="10"
                  />
                </div>
                <div className="flex justify-end items-end gap-4">
                  <button type="button" onClick={resetForm} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95">
                    {editingProductId ? 'Sync Entity' : 'Commit to Cloud'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Products Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Inventory Assets...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8">
            <Package className="text-slate-200" size={64} />
          </div>
          <h3 className="text-3xl font-black text-slate-900">Your Vault is Empty</h3>
          <p className="text-slate-400 mt-2 max-w-sm font-medium">Add your first product to begin your enterprise inventory experience.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Premium Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.map((product) => (
            <div key={product._id} className="group bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 flex flex-col h-full">
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                {product.image ? (
                  <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={product.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                    <Package size={64} className="text-indigo-100" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl ${product.stocks.totalStock <= (product.stocks.reorderLevel || 10)
                    ? 'bg-rose-500/90 text-white'
                    : 'bg-emerald-500/90 text-white'
                    }`}>
                    {product.stocks.totalStock === 0 ? 'Depleted' : product.stocks.totalStock <= (product.stocks.reorderLevel || 10) ? 'Low Stock' : 'Optimized'}
                  </span>
                </div>

                <div className="absolute bottom-8 left-8 right-8 translate-y-20 group-hover:translate-y-0 transition-transform duration-700 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-4 bg-white rounded-2xl text-indigo-600 shadow-2xl hover:scale-110 transition-transform">
                      <Edit size={22} />
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="p-4 bg-rose-600 rounded-2xl text-white shadow-2xl hover:scale-110 transition-transform">
                      <Trash2 size={22} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Stock Position</p>
                    <p className="text-2xl font-black text-white">{product.stocks.totalStock} <span className="text-[10px] opacity-60">UNITS</span></p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">{product.category?.name || 'General Inventory'}</p>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">MSRP</span>
                    <span className="text-2xl font-black text-slate-900">Rs {parseFloat(product.sellingPrice).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Cost</span>
                    <span className="text-sm font-black text-slate-500 italic">Rs {parseFloat(product.costPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Enhanced Premium List View */
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity</th>
                  <th className="px-10 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Entity Details</th>
                  <th className="px-10 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Price Logic</th>
                  <th className="px-10 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Stock Flow</th>
                  <th className="px-10 py-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Orchestrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product._id} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-10 py-8">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 overflow-hidden border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-500 relative">
                        {product.image ? (
                          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <Package size={32} className="text-slate-200" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{product.name}</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black mt-2 w-fit uppercase tracking-widest">{product.sku}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-900">Rs {parseFloat(product.sellingPrice).toLocaleString()}</span>
                        <span className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">Yield: Rs {Math.max(0, product.sellingPrice - product.costPrice).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm ${product.stocks.totalStock <= (product.stocks.reorderLevel || 10)
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-emerald-600'
                          }`}>
                          {product.stocks.totalStock} Units
                        </div>
                        {product.stocks.totalStock <= (product.stocks.reorderLevel || 10) && (
                          <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => handleEdit(product)} className="p-4 bg-white shadow-xl rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1">
                          <Edit size={22} />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-4 bg-white shadow-xl rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all transform hover:-translate-y-1">
                          <Trash2 size={22} />
                        </button>
                      </div>
                    </td>
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
