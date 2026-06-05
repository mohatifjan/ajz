import PDFDocument from 'pdfkit';
import CustomerLedger, { calculateAgingBucket } from '../models/CustomerLedger.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { formatCurrency, formatDate, formatNumber } from '../utils/exportUtils.js';

export const getCustomerLedger = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate, sort = '-createdAt' } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const query = { customer: customerId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [ledgerEntries, total] = await Promise.all([
      CustomerLedger.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'email name')
        .lean(),
      CustomerLedger.countDocuments(query)
    ]);

    // Update aging buckets
    ledgerEntries.forEach(entry => {
      entry.agingBucket = calculateAgingBucket(entry.status, entry.dueDate);
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        ledger: ledgerEntries,
        customer: {
          id: customer._id,
          companyName: customer.companyName,
          email: customer.email,
          phone: customer.phone,
          creditLimit: customer.creditLimit,
          creditUsed: customer.creditUsed,
          totalOutstanding: customer.totalOutstanding
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAgingReport = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const ledgerEntries = await CustomerLedger.find({
      customer: customerId,
      status: { $in: ['pending', 'partial', 'overdue'] }
    }).lean();

    // Calculate aging buckets
    const agingBuckets = {
      current: { amount: 0, count: 0, days: '0-30' },
      '30_days': { amount: 0, count: 0, days: '31-60' },
      '60_days': { amount: 0, count: 0, days: '61-90' },
      '90_days': { amount: 0, count: 0, days: '91-120' },
      'over_90': { amount: 0, count: 0, days: '120+' }
    };

    ledgerEntries.forEach(entry => {
      const bucket = calculateAgingBucket(entry.status, entry.dueDate);

      const balance = entry.debit - entry.credit;
      if (balance > 0) {
        agingBuckets[bucket].amount += balance;
        agingBuckets[bucket].count += 1;
      }
    });

    const agingReport = Object.keys(agingBuckets).map(key => ({
      bucket: key,
      label: agingBuckets[key].days,
      amount: agingBuckets[key].amount,
      count: agingBuckets[key].count,
      percentage: ((agingBuckets[key].amount / customer.totalOutstanding) * 100 || 0).toFixed(2)
    }));

    const totalOutstanding = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);

    res.status(200).json({
      status: 'success',
      data: {
        customer: {
          id: customer._id,
          companyName: customer.companyName,
          creditLimit: customer.creditLimit,
          creditUsed: customer.creditUsed,
          totalOutstanding: customer.totalOutstanding
        },
        agingReport,
        summary: {
          totalOutstanding,
          totalDueItems: ledgerEntries.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCustomersAgingReport = async (req, res, next) => {
  try {
    const customers = await Customer.find({ status: 'active' }).lean();

    const agingData = await Promise.all(
      customers.map(async (customer) => {
        const ledgerEntries = await CustomerLedger.find({
          customer: customer._id,
          status: { $in: ['pending', 'partial', 'overdue'] }
        }).lean();

        const agingBuckets = {
          current: 0,
          '30_days': 0,
          '60_days': 0,
          '90_days': 0,
          'over_90': 0
        };

        ledgerEntries.forEach(entry => {
          const bucket = calculateAgingBucket(entry.status, entry.dueDate);
          const balance = entry.debit - entry.credit;
          if (balance > 0) {
            agingBuckets[bucket] += balance;
          }
        });

        return {
          customerId: customer._id,
          companyName: customer.companyName,
          email: customer.email,
          phone: customer.phone,
          creditLimit: customer.creditLimit,
          creditUsed: customer.creditUsed,
          totalOutstanding: customer.totalOutstanding,
          ...agingBuckets
        };
      })
    );

    res.status(200).json({
      success: true,
      data: agingData.filter(item => item.totalOutstanding > 0)
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerStatement = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const query = { customer: customerId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const ledgerEntries = await CustomerLedger.find(query)
      .sort({ createdAt: 1 })
      .populate('reference.order', 'orderNumber')
      .populate('reference.invoice', 'invoiceNumber')
      .lean();

    let openingBalance = 0;
    let runningBalance = 0;

    const statement = ledgerEntries.map(entry => {
      runningBalance = entry.runningBalance;
      return {
        date: formatDate(entry.createdAt),
        description: entry.description,
        reference: entry.transactionNumber,
        debit: formatCurrency(entry.debit),
        credit: formatCurrency(entry.credit),
        balance: formatCurrency(entry.runningBalance),
        status: entry.status,
        dueDate: formatDate(entry.dueDate)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        customer: {
          companyName: customer.companyName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          gstNumber: customer.gstNumber,
          panNumber: customer.panNumber,
          creditLimit: formatCurrency(customer.creditLimit),
          creditUsed: formatCurrency(customer.creditUsed),
          availableCredit: formatCurrency(customer.creditLimit - customer.creditUsed)
        },
        statement,
        generatedDate: formatDate(new Date()),
        periodStart: startDate ? formatDate(new Date(startDate)) : 'All',
        periodEnd: endDate ? formatDate(new Date(endDate)) : 'Current',
        closingBalance: formatCurrency(runningBalance)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const reconcileLedger = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { ledgerIds } = req.body;

    if (!ledgerIds || !Array.isArray(ledgerIds)) {
      return res.status(400).json({ success: false, message: 'ledgerIds array is required' });
    }

    const updated = await CustomerLedger.updateMany(
      { _id: { $in: ledgerIds }, customer: customerId },
      {
        $set: {
          reconciled: true,
          lastReconciled: new Date(),
          updatedBy: req.user.id
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `${updated.modifiedCount} entries reconciled`,
      data: { modifiedCount: updated.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

export const createLedgerEntry = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { transactionType, transactionNumber, debit, credit, dueDate, description, reference } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const ledgerEntry = new CustomerLedger({
      customer: customerId,
      transactionType,
      transactionNumber,
      debit,
      credit,
      dueDate,
      description,
      reference,
      createdBy: req.user.id
    });

    await ledgerEntry.save();

    res.status(201).json({
      success: true,
      message: 'Ledger entry created',
      data: ledgerEntry
    });
  } catch (error) {
    next(error);
  }
};

export const updateLedgerEntry = async (req, res, next) => {
  try {
    const { customerId, ledgerId } = req.params;
    const { status, paymentDate, notes } = req.body;

    const ledgerEntry = await CustomerLedger.findOneAndUpdate(
      { _id: ledgerId, customer: customerId },
      {
        status,
        paymentDate,
        notes,
        updatedBy: req.user.id
      },
      { new: true }
    );

    if (!ledgerEntry) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Ledger entry updated',
      data: ledgerEntry
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerStatementPDF = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const query = { customer: customerId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const ledgerEntries = await CustomerLedger.find(query)
      .sort({ createdAt: 1 })
      .populate('reference.order', 'orderNumber')
      .populate('reference.invoice', 'invoiceNumber')
      .lean();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream PDF to buffer for response
    const filename = `Statement_${customer.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- Header Section ---
    doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text('AJ TRADERS', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Premium ERP Solutions', 50, 80);
    doc.fillColor('#64748b').text('Generated on: ' + formatDate(new Date()), { align: 'right' });

    doc.moveDown(2);
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(30, 110).lineTo(565, 110).stroke();

    // --- Body / Info Section ---
    doc.moveDown(2);
    const startY = doc.y;

    // Customer Info (Left)
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('CUSTOMER STATEMENT', 50, startY);
    doc.fontSize(10).font('Helvetica-Bold').text(customer.companyName || 'Unknown Customer', 50, startY + 25);
    doc.font('Helvetica').fillColor('#475569');
    doc.text(customer.email || 'N/A', 50, startY + 40);
    doc.text(customer.phone || 'N/A', 50, startY + 55);
    if (customer.address) doc.text(customer.address, 50, startY + 70, { width: 250 });

    // Account Summary (Right)
    const rightX = 350;
    doc.fillColor('#0f172a').font('Helvetica-Bold').text('ACCOUNT SUMMARY', rightX, startY);
    doc.rect(rightX, startY + 15, 200, 75).fill('#f8fafc');
    doc.fillColor('#475569').font('Helvetica').fontSize(9);

    doc.text('Period:', rightX + 10, startY + 25);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(`${startDate ? formatDate(startDate) : 'Beginning'} - ${endDate ? formatDate(endDate) : 'Present'}`, rightX + 80, startY + 25);

    doc.fillColor('#475569').font('Helvetica').text('Credit Limit:', rightX + 10, startY + 45);
    doc.fillColor('#0f172a').text(formatCurrency(customer.creditLimit || 0), rightX + 80, startY + 45);

    doc.fillColor('#475569').text('Outstanding:', rightX + 10, startY + 65);
    doc.fillColor('#ef4444').font('Helvetica-Bold').fontSize(12).text(formatCurrency(customer.totalOutstanding || 0), rightX + 80, startY + 63);

    // --- Table Header ---
    doc.moveDown(4);
    const tableTop = doc.y + 20;
    doc.rect(50, tableTop, 515, 20).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');

    doc.text('DATE', 60, tableTop + 6);
    doc.text('DESCRIPTION', 130, tableTop + 6);
    doc.text('REFERENCE', 280, tableTop + 6);
    doc.text('DEBIT', 380, tableTop + 6, { width: 50, align: 'right' });
    doc.text('CREDIT', 440, tableTop + 6, { width: 50, align: 'right' });
    doc.text('BALANCE', 500, tableTop + 6, { width: 55, align: 'right' });

    // --- Table Rows ---
    let currentY = tableTop + 20;
    doc.fillColor('#334155').font('Helvetica').fontSize(8);

    ledgerEntries.forEach((entry, i) => {
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(50, currentY, 515, 20).fill('#f1f5f9');
      }

      doc.fillColor('#334155');
      doc.text(formatDate(entry.createdAt), 60, currentY + 6);
      doc.text((entry.description || 'N/A').substring(0, 35), 130, currentY + 6);
      doc.text(entry.transactionNumber || 'N/A', 280, currentY + 6);
      doc.text(formatNumber(entry.debit || 0), 380, currentY + 6, { width: 50, align: 'right' });
      doc.text(formatNumber(entry.credit || 0), 440, currentY + 6, { width: 50, align: 'right' });
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatNumber(entry.runningBalance || 0), 500, currentY + 6, { width: 55, align: 'right' });
      doc.font('Helvetica');

      currentY += 20;

      // Page break check
      if (currentY > 750) {
        doc.addPage();
        doc.rect(50, 50, 515, 20).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('DATE', 60, 56);
        doc.text('DESCRIPTION', 130, 56);
        doc.text('REFERENCE', 280, 56);
        doc.text('DEBIT', 380, 56, { width: 50, align: 'right' });
        doc.text('CREDIT', 440, 56, { width: 50, align: 'right' });
        doc.text('BALANCE', 500, 56, { width: 55, align: 'right' });
        currentY = 70;
      }
    });

    // --- Footer ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94a3b8').text(
        `Page ${i + 1} of ${pageCount} | Generated by AJ Traders ERP`,
        50,
        780,
        { align: 'center', width: 515 }
      );
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
