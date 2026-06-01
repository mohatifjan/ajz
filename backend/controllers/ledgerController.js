import CustomerLedger from '../models/CustomerLedger.js';
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
      const ledgerObj = Object.assign(Object.create(CustomerLedger.prototype), entry);
      ledgerObj.updateAgingBucket();
      entry.agingBucket = ledgerObj.agingBucket;
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
      const ledgerObj = Object.assign(Object.create(CustomerLedger.prototype), entry);
      ledgerObj.updateAgingBucket();
      const bucket = ledgerObj.agingBucket;

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
          const ledgerObj = Object.assign(Object.create(CustomerLedger.prototype), entry);
          ledgerObj.updateAgingBucket();
          const bucket = ledgerObj.agingBucket;
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
