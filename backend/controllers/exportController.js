import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import { generatePDFReport, generateExcelReport, generateCSVReport, formatCurrency, formatDate, formatNumber } from '../utils/exportUtils.js';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Sales Report Export
export const exportSalesReport = async (req, res, next) => {
  try {
    const { period = 'monthly', format = 'excel', startDate, endDate } = req.query;

    let dateRange;
    switch (period) {
      case 'daily':
        dateRange = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'weekly':
        dateRange = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case 'monthly':
      default:
        dateRange = { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
    }

    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find({
      createdAt: dateRange,
      status: { $ne: 'cancelled' }
    })
      .populate('customer', 'companyName')
      .sort({ createdAt: -1 })
      .lean();

    const data = orders.map(order => ({
      'Order ID': order.orderNumber,
      'Date': formatDate(order.createdAt),
      'Customer': order.customer?.companyName || 'N/A',
      'Amount': formatCurrency(order.summary.totalAmount),
      'Cost': formatCurrency(order.summary.totalCost),
      'Profit': formatCurrency(order.summary.grossProfit),
      'Payment Method': order.paymentMethod,
      'Status': order.status
    }));

    const filename = `sales_report_${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDFReport(
        `Sales Report - ${period.toUpperCase()}`,
        Object.keys(data[0] || {}),
        data,
        filename
      );
    } else if (format === 'excel') {
      filePath = await generateExcelReport(
        `Sales Report - ${period.toUpperCase()}`,
        [{
          name: 'Sales Report',
          headers: Object.keys(data[0] || {}),
          data: data
        }],
        filename
      );
    } else {
      filePath = await generateCSVReport(
        Object.keys(data[0] || {}),
        data,
        filename
      );
    }

    res.download(filePath, filename, (err) => {
      if (err) next(err);
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    });
  } catch (error) {
    next(error);
  }
};

// Profit & Loss Report Export
export const exportProfitLossReport = async (req, res, next) => {
  try {
    const { period = 'monthly', format = 'excel', startDate, endDate } = req.query;

    let dateRange;
    switch (period) {
      case 'daily':
        dateRange = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'weekly':
        dateRange = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case 'monthly':
      default:
        dateRange = { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
    }

    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const profitLoss = await Order.aggregate([
      {
        $match: {
          createdAt: dateRange,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          totalRevenue: { $sum: '$summary.totalAmount' },
          totalCost: { $sum: '$summary.totalCost' },
          totalProfit: { $sum: '$summary.grossProfit' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const data = profitLoss.map(item => ({
      'Period': item._id,
      'Revenue': formatCurrency(item.totalRevenue),
      'Cost': formatCurrency(item.totalCost),
      'Profit': formatCurrency(item.totalProfit),
      'Margin %': formatNumber((item.totalProfit / item.totalRevenue * 100) || 0),
      'Orders': item.totalOrders
    }));

    const filename = `profit_loss_report_${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDFReport(
        `Profit & Loss Report - ${period.toUpperCase()}`,
        Object.keys(data[0] || {}),
        data,
        filename
      );
    } else if (format === 'excel') {
      filePath = await generateExcelReport(
        `Profit & Loss Report - ${period.toUpperCase()}`,
        [{
          name: 'P&L Report',
          headers: Object.keys(data[0] || {}),
          data: data
        }],
        filename
      );
    } else {
      filePath = await generateCSVReport(
        Object.keys(data[0] || {}),
        data,
        filename
      );
    }

    res.download(filePath, filename, (err) => {
      if (err) next(err);
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    });
  } catch (error) {
    next(error);
  }
};

// Customer Outstanding Report Export
export const exportCustomerOutstandingReport = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const customers = await Customer.find({ status: 'active' }).lean();

    const data = customers
      .filter(c => c.totalOutstanding > 0)
      .map(customer => ({
        'Customer Name': customer.companyName,
        'Contact Person': `${customer.contactPerson?.firstName} ${customer.contactPerson?.lastName}`,
        'Email': customer.email,
        'Phone': customer.phone,
        'Outstanding': formatCurrency(customer.totalOutstanding),
        'Credit Limit': formatCurrency(customer.creditLimit),
        'Credit Used': formatCurrency(customer.creditUsed),
        'Account Status': customer.accountStatus
      }))
      .sort((a, b) => parseFloat(b['Outstanding']) - parseFloat(a['Outstanding']));

    const filename = `customer_outstanding_${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDFReport(
        'Customer Outstanding Report',
        Object.keys(data[0] || {}),
        data,
        filename
      );
    } else if (format === 'excel') {
      filePath = await generateExcelReport(
        'Customer Outstanding Report',
        [{
          name: 'Outstanding',
          headers: Object.keys(data[0] || {}),
          data: data
        }],
        filename
      );
    } else {
      filePath = await generateCSVReport(
        Object.keys(data[0] || {}),
        data,
        filename
      );
    }

    res.download(filePath, filename, (err) => {
      if (err) next(err);
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    });
  } catch (error) {
    next(error);
  }
};

// Inventory Valuation Report Export
export const exportInventoryValuationReport = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const products = await Product.find({ status: 'active' }).populate('category', 'name').lean();

    const data = products.map(product => ({
      'SKU': product.sku,
      'Product Name': product.name,
      'Category': product.category?.name || 'N/A',
      'Current Stock': product.currentStock,
      'Cost Price': formatCurrency(product.costPrice),
      'Selling Price': formatCurrency(product.sellingPrice),
      'Stock Value (Cost)': formatCurrency(product.currentStock * product.costPrice),
      'Stock Value (Retail)': formatCurrency(product.currentStock * product.sellingPrice)
    }));

    const totals = data.reduce((acc, item) => ({
      'SKU': 'TOTAL',
      'Product Name': '',
      'Category': '',
      'Current Stock': acc['Current Stock'] + parseInt(item['Current Stock']) || 0,
      'Cost Price': '',
      'Selling Price': '',
      'Stock Value (Cost)': formatCurrency(
        (parseFloat(acc['Stock Value (Cost)']?.replace('$', '')) || 0) +
        parseFloat(item['Stock Value (Cost)']?.replace('$', '') || 0)
      ),
      'Stock Value (Retail)': formatCurrency(
        (parseFloat(acc['Stock Value (Retail)']?.replace('$', '')) || 0) +
        parseFloat(item['Stock Value (Retail)']?.replace('$', '') || 0)
      )
    }), data[0] || {});

    data.push(totals);

    const filename = `inventory_valuation_${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDFReport(
        'Inventory Valuation Report',
        Object.keys(data[0] || {}),
        data,
        filename
      );
    } else if (format === 'excel') {
      filePath = await generateExcelReport(
        'Inventory Valuation Report',
        [{
          name: 'Inventory',
          headers: Object.keys(data[0] || {}),
          data: data
        }],
        filename
      );
    } else {
      filePath = await generateCSVReport(
        Object.keys(data[0] || {}),
        data,
        filename
      );
    }

    res.download(filePath, filename, (err) => {
      if (err) next(err);
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    });
  } catch (error) {
    next(error);
  }
};

// Invoice Export
export const exportInvoice = async (req, res, next) => {
  try {
    const { invoiceId, format = 'pdf' } = req.query;

    const invoice = await Invoice.findById(invoiceId)
      .populate('customer', 'companyName email phone address')
      .populate('order', 'orderNumber')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const data = [{
      'Invoice #': invoice.invoiceNumber,
      'Date': formatDate(invoice.invoiceDate),
      'Customer': invoice.customer?.companyName,
      'Subtotal': formatCurrency(invoice.summary.subtotal),
      'Discount': formatCurrency(invoice.summary.discount),
      'Tax': formatCurrency(invoice.summary.tax),
      'Total': formatCurrency(invoice.summary.totalAmount),
      'Paid': formatCurrency(invoice.summary.paidAmount),
      'Due': formatCurrency(invoice.summary.totalAmount - invoice.summary.paidAmount)
    }];

    const filename = `invoice_${invoice.invoiceNumber}_${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDFReport(
        `Invoice ${invoice.invoiceNumber}`,
        Object.keys(data[0] || {}),
        data,
        filename
      );
    } else if (format === 'excel') {
      filePath = await generateExcelReport(
        `Invoice ${invoice.invoiceNumber}`,
        [{
          name: 'Invoice',
          headers: Object.keys(data[0] || {}),
          data: data
        }],
        filename
      );
    } else {
      filePath = await generateCSVReport(
        Object.keys(data[0] || {}),
        data,
        filename
      );
    }

    res.download(filePath, filename, (err) => {
      if (err) next(err);
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    });
  } catch (error) {
    next(error);
  }
};
