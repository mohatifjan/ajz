import React, { useState, useRef, useEffect } from 'react';
import { barcodeAPI } from '../services/api';
import { Barcode, QrCode, Download, AlertCircle, CheckCircle, Package } from 'lucide-react';

export default function BarcodeScannerPage() {
  const [activeTab, setActiveTab] = useState('scan');
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchStatistics();
    if (barcodeInputRef.current && activeTab === 'scan') {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  const fetchStatistics = async () => {
    try {
      const res = await barcodeAPI.getStatistics();
      if (res.data.success) {
        setStatistics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics');
    }
  };

  const handleScanBarcode = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) {
      setError('Please enter or scan a barcode');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await barcodeAPI.scanBarcode(barcode);
      if (res.data.success) {
        setScannedProduct(res.data.data.product);
        setSuccess('Product found successfully');
        setBarcode('');
        setTimeout(() => {
          setSuccess('');
          barcodeInputRef.current?.focus();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
      setScannedProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBarcode = async (productId) => {
    try {
      const res = await barcodeAPI.generateProductBarcode(productId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode_${productId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download barcode');
    }
  };

  const downloadQRCode = async (productId) => {
    try {
      const res = await barcodeAPI.generateQRCode(productId);
      if (res.data.success) {
        const link = document.createElement('a');
        link.href = res.data.data.qrCode;
        link.download = `qrcode_${productId}.png`;
        link.click();
      }
    } catch (err) {
      alert('Failed to download QR code');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Barcode & QR Code Manager</h1>
        <p className="text-gray-600 mt-2">Scan barcodes, generate codes, and manage product identification.</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalProducts}</p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">With Barcode</p>
                <p className="text-3xl font-bold text-green-600">{statistics.productsWithBarcode}</p>
              </div>
              <Barcode className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Without Barcode</p>
                <p className="text-3xl font-bold text-red-600">{statistics.productsWithoutBarcode}</p>
              </div>
              <AlertCircle className="text-red-500" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Coverage</p>
                <p className="text-3xl font-bold text-purple-600">{statistics.barcodePercentage}</p>
              </div>
              <CheckCircle className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'scan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Scan Barcode
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'generate'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Generate Code
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Scan Tab */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Scan Product Barcode</h2>

              <form onSubmit={handleScanBarcode}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Input</label>
                  <div className="flex gap-2">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Scan or enter barcode..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !barcode.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      {isLoading ? 'Scanning...' : 'Scan'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    💡 Tip: Make sure your scanner is configured to send Enter key after each scan
                  </p>
                </div>
              </form>

              {scannedProduct && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">SKU</p>
                      <p className="text-lg font-bold text-gray-900">{scannedProduct.sku}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-lg font-bold text-gray-900">{scannedProduct.name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-lg font-bold text-gray-900">{scannedProduct.category}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className={`text-lg font-bold ${
                        scannedProduct.currentStock <= scannedProduct.reorderLevel ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {scannedProduct.currentStock} units
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Selling Price</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{scannedProduct.sellingPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`text-lg font-bold ${
                        scannedProduct.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {scannedProduct.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>✓ Ensure barcode scanner is configured correctly</li>
              <li>✓ Scanner should send Enter key automatically</li>
              <li>✓ Use CODE128 or similar standard formats</li>
              <li>✓ Enter barcode manually if scanner unavailable</li>
              <li>✓ Product SKU can also be used as barcode</li>
              <li>✓ Check barcode coverage in statistics</li>
            </ul>
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Barcode / QR Code</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
            <input
              type="text"
              placeholder="Enter Product ID or Scan Product first"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            {scannedProduct && (
              <p className="text-sm text-gray-600 mt-2">
                Using: {scannedProduct.name} (SKU: {scannedProduct.sku})
              </p>
            )}
          </div>

          {scannedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
                <Barcode className="mx-auto mb-4 text-blue-500" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Barcode</h3>
                <button
                  onClick={() => downloadBarcode(scannedProduct.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Download size={18} />
                  Download Barcode
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
                <QrCode className="mx-auto mb-4 text-purple-500" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
                <button
                  onClick={() => downloadQRCode(scannedProduct.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Download size={18} />
                  Download QR Code
                </button>
              </div>
            </div>
          )}

          {!scannedProduct && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} />
              Please scan a product barcode first to generate codes
            </div>
          )}
        </div>
      )}
    </div>
  );
}
