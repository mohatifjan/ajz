import React, { useState, useEffect } from 'react';
import { invoiceAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { Search, Printer } from 'lucide-react';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState('');
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await invoiceAPI.getAll({ page: 1, limit: 25 });
      setInvoices(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      return fetchInvoices();
    }

    try {
      const response = await invoiceAPI.search({ search });
      setInvoices(response.data.data);
      setSelectedInvoice(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleView = async (invoiceNumber) => {
    try {
      setIsLoadingInvoice(true);
      const response = await invoiceAPI.getByNumber(invoiceNumber);
      setSelectedInvoice(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8 no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Search by invoice number, review billing records, and print AJ Traders invoices.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="bg-white rounded-lg shadow no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="border-b px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                      <td className="border-b px-4 py-3">{invoice.customer?.name || 'Unknown'}</td>
                      <td className="border-b px-4 py-3">{formatCurrency(invoice.summary?.totalAmount)}</td>
                      <td className="border-b px-4 py-3 capitalize">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="border-b px-4 py-3">
                        <button
                          onClick={() => handleView(invoice.invoiceNumber)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow p-6 ${selectedInvoice ? 'printable-area' : 'no-print'}`}>
          <div className="flex items-center justify-between mb-4 no-print">
            <h2 className="text-xl font-semibold">Invoice Details</h2>
            {selectedInvoice && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 no-print"
              >
                <Printer size={16} />
                Print
              </button>
            )}
          </div>

          {isLoadingInvoice ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading invoice details...</p>
            </div>
          ) : !selectedInvoice ? (
            <p className="text-gray-600 text-center py-12">Select an invoice from the list to preview details.</p>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-blue-600 tracking-tighter uppercase">AJ TRADERS</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Point of Sale & Inventory System</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px]">Invoice</div>
                    <div className="text-lg font-black text-gray-900">#{selectedInvoice.invoiceNumber}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Billed To</div>
                  <div className="font-bold text-gray-900 text-lg">{selectedInvoice.customer?.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{selectedInvoice.customer?.email}</div>
                  <div className="text-sm text-gray-600 font-medium">{selectedInvoice.customer?.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Invoice Details</div>
                  <div className="text-sm text-gray-900 font-bold text-[11px] uppercase tracking-wide">Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-GB')}</div>
                  <div className="text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      Status: {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Description</th>
                      <th className="px-4 py-3 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Qty</th>
                      <th className="px-4 py-3 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Price</th>
                      <th className="px-4 py-3 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">{item.product?.name || item.description || 'General Item'}</div>
                          <div className="text-[10px] text-gray-500 uppercase mt-0.5">
                            {item.product?.sku && `SKU: ${item.product.sku}`} {item.unit && `| Unit: ${item.unit}`}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-4 text-right font-medium text-gray-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-[200px] space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                      <span className="font-bold text-gray-900">{formatCurrency(selectedInvoice.summary?.subtotal)}</span>
                    </div>
                    {selectedInvoice.summary?.tax > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Tax</span>
                        <span className="font-bold text-gray-900">{formatCurrency(selectedInvoice.summary?.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-lg shadow-lg">
                      <span className="font-black uppercase tracking-widest text-xs">Total</span>
                      <span className="font-black text-lg">{formatCurrency(selectedInvoice.summary?.totalAmount)}</span>
                    </div>
                    {selectedInvoice.summary?.dueAmount > 0 && (
                      <div className="flex justify-between items-center text-red-600 font-bold p-1">
                        <span className="text-[10px] uppercase tracking-widest">Due</span>
                        <span className="text-sm">{formatCurrency(selectedInvoice.summary?.dueAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-gray-50 p-4 rounded-xl mt-8">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</div>
                  <p className="text-xs text-gray-600 italic">"{selectedInvoice.notes}"</p>
                </div>
              )}

              <div className="text-center pt-12 no-print">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Thank you for your business</p>
              </div>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}
