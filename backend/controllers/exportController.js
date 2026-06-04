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
    const { invoiceId } = req.query;

    const invoice = await Invoice.findById(invoiceId)
      .populate('customer')
      .populate('order', 'orderNumber')
      .populate('items.product', 'name sku')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const filename = `invoice_${invoice.invoiceNumber}.pdf`;
    const filePath = join(__dirname, '../temp', filename);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);

    // BRANDING
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2563eb').text('AJ TRADERS', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Point of Sale & Inventory System', 50, 80);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#475569').text(`#${invoice.invoiceNumber}`, 400, 80, { align: 'right' });

    doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e2e8f0').stroke();

    // CUSTOMER & DETAILS
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text('BILLED TO', 50, 130);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text(invoice.customer?.companyName || 'N/A', 50, 145);
    doc.fontSize(10).font('Helvetica').fillColor('#475569').text(invoice.customer?.email || '', 50, 160);
    doc.fontSize(10).font('Helvetica').fillColor('#475569').text(invoice.customer?.phone || '', 50, 175);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text('INVOICE DATE', 400, 130, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#0f172a').text(formatDate(invoice.invoiceDate), 400, 145, { align: 'right' });

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text('STATUS', 400, 165, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb').text(invoice.status?.toUpperCase(), 400, 180, { align: 'right' });

    // TABLE HEADERS
    const tableTop = 220;
    doc.rect(50, tableTop, 500, 25).fill('#f8fafc');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    doc.text('DESCRIPTION', 60, tableTop + 8);
    doc.text('QTY', 300, tableTop + 8, { width: 50, align: 'center' });
    doc.text('PRICE', 360, tableTop + 8, { width: 80, align: 'right' });
    doc.text('TOTAL', 450, tableTop + 8, { width: 90, align: 'right' });

    // ITEMS
    let y = tableTop + 35;
    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    invoice.items.forEach((item) => {
      const productName = item.product?.name || item.description || 'General Item';
      const sku = item.product?.sku ? `(${item.product.sku})` : '';

      doc.font('Helvetica-Bold').text(productName, 60, y);
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(sku, 60, y + 10);

      doc.fontSize(9).fillColor('#1e293b');
      doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'center' });
      doc.text(formatCurrency(item.unitPrice), 360, y, { width: 80, align: 'right' });
      doc.text(formatCurrency(item.lineTotal), 450, y, { width: 90, align: 'right' });

      y += 30;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // SUMMARY
    doc.moveTo(350, y).lineTo(550, y).strokeColor('#e2e8f0').stroke();
    y += 15;

    const summaryX = 350;
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Subtotal', summaryX, y);
    doc.font('Helvetica-Bold').fillColor('#1e293b').text(formatCurrency(invoice.summary.subtotal), summaryX + 100, y, { align: 'right', width: 100 });
    y += 20;

    if (invoice.summary.discount > 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Discount', summaryX, y);
      doc.font('Helvetica-Bold').fillColor('#ef4444').text(`-${formatCurrency(invoice.summary.discount)}`, summaryX + 100, y, { align: 'right', width: 100 });
      y += 20;
    }

    doc.rect(350, y, 200, 30).fill('#2563eb');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('TOTAL', 360, y + 9);
    doc.text(formatCurrency(invoice.summary.totalAmount), summaryX + 50, y + 9, { align: 'right', width: 140 });

    if (invoice.notes) {
      y += 60;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text('NOTES', 50, y);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#475569').text(invoice.notes, 50, y + 15, { width: 300 });
    }

    doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, filename, (err) => {
        if (err) next(err);
        try {
          unlinkSync(filePath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
      });
    });
  } catch (error) {
    next(error);
  }
};
