import React, { useState, useEffect } from 'react';
import { invoiceAPI } from '../services/api';
import { Search, Printer } from 'lucide-react';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState('');

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
      const response = await invoiceAPI.getByNumber(invoiceNumber);
      setSelectedInvoice(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Search by invoice number, review billing records, and print AJ Traders invoices.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number"
            className="w-full md:w-72 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 flex items-center gap-2"
          >
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Invoice list</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead>
                <tr>
                  <th className="border-b px-4 py-3">Invoice</th>
                  <th className="border-b px-4 py-3">Customer</th>
                  <th className="border-b px-4 py-3">Total</th>
                  <th className="border-b px-4 py-3">Status</th>
                  <th className="border-b px-4 py-3">Action</th>
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
                      <td className="border-b px-4 py-3">Rs. {invoice.summary?.totalAmount?.toFixed(2)}</td>
                      <td className="border-b px-4 py-3 capitalize">{invoice.status}</td>
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Invoice details</h2>
            {selectedInvoice && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
              >
                <Printer size={16} />
                Print
              </button>
            )}
          </div>

          {!selectedInvoice ? (
            <p className="text-gray-600">Select an invoice from the list to preview the full billing details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Invoice Number</div>
                <div className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-gray-500">Customer</div>
                  <div className="font-medium">{selectedInvoice.customer?.name}</div>
                  <div className="text-sm text-gray-500">{selectedInvoice.customer?.email}</div>
                  <div className="text-sm text-gray-500">{selectedInvoice.customer?.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Invoice Date</div>
                  <div className="font-medium">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-500">Status: {selectedInvoice.status}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500">Item</th>
                      <th className="px-4 py-2 text-right text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-right text-gray-500">Unit</th>
                      <th className="px-4 py-2 text-right text-gray-500">Price</th>
                      <th className="px-4 py-2 text-right text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedInvoice.items.map((item) => (
                      <tr key={`${item.product}_${item.quantity}`}>
                        <td className="px-4 py-3">{item.variation?.size || item.description || 'Item'}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{item.unit}</td>
                        <td className="px-4 py-3 text-right">Rs. {item.unitPrice?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">Rs. {item.lineTotal?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Subtotal</div>
                  <div className="text-xl font-semibold">Rs. {selectedInvoice.summary?.subtotal?.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                  <div className="text-xl font-semibold">Rs. {selectedInvoice.summary?.totalAmount?.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Due: Rs. {selectedInvoice.summary?.dueAmount?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
