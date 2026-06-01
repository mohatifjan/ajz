import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { validationResult } from 'express-validator';

export const createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { email } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer with this email already exists'
      });
    }

    const customer = new Customer(req.body);
    await customer.save();

    res.status(201).json({
      status: 'success',
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'active', search, customerType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (customerType) query.customerType = customerType;

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const customers = await Customer.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: customers,
      pagination: {
        currentPage: parseInt(page),
        total,
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    // Get recent orders
    const recentOrders = await Order.find({ customer: customer._id })
      .limit(10)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        customer,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerLedger = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }

    const orders = await Order.find({ customer: customer._id }).sort({ createdAt: 1 });
    const payments = await Payment.find({ customer: customer._id }).sort({ paymentDate: 1, createdAt: 1 });

    const entries = [
      ...orders.map((order) => ({
        type: 'invoice',
        date: order.invoiceDate || order.createdAt,
        reference: order.invoiceNumber || order.orderNumber,
        description: `Invoice for ${order.orderNumber}`,
        debit: order.summary.totalAmount,
        credit: 0,
        dueDate: order.dueDate,
        orderId: order._id
      })),
      ...payments.map((payment) => ({
        type: 'payment',
        date: payment.paymentDate || payment.createdAt,
        reference: payment.paymentNumber,
        description: `Payment via ${payment.paymentMethod}`,
        debit: 0,
        credit: payment.amount,
        paymentId: payment._id
      }))
    ];

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    const ledgerEntries = entries.map((entry) => {
      balance += (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry,
        balance
      };
    });

    const totalInvoices = orders.reduce((sum, order) => sum + (order.summary.totalAmount || 0), 0);
    const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const outstanding = totalInvoices - totalPayments;
    const aging = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '91+': 0
    };

    const today = new Date();
    orders.forEach((order) => {
      const dueDate = order.dueDate ? new Date(order.dueDate) : null;
      if (order.amountDue > 0 && dueDate) {
        const ageDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        if (ageDays <= 30) aging['0-30'] += order.amountDue;
        else if (ageDays <= 60) aging['31-60'] += order.amountDue;
        else if (ageDays <= 90) aging['61-90'] += order.amountDue;
        else aging['91+'] += order.amountDue;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        customer,
        ledgerEntries,
        summary: {
          totalInvoices,
          totalPayments,
          outstanding,
          aging
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const allowedFields = [
      'companyName', 'contactPerson', 'email', 'phone', 'alternatePhone',
      'address', 'shippingAddress', 'gstNumber', 'panNumber', 'creditLimit',
      'paymentTerms', 'discount', 'status', 'notes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const getTopCustomers = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$summary.totalAmount' },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      {
        $unwind: '$customerDetails'
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: topCustomers
    });
  } catch (error) {
    next(error);
  }
};

export const getOverduePayments = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const overdueCustomers = await Customer.find({
      totalOutstanding: { $gt: 0 },
      accountStatus: { $in: ['overdue', 'delinquent'] },
      overdueDays: { $gte: days }
    }).sort({ overdueDays: -1 });

    res.status(200).json({
      status: 'success',
      data: overdueCustomers
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
