import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import { validationResult } from 'express-validator';
import { generateInvoiceNumber } from '../utils/helpers.js';

const generateOrderNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    }
  });
  return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { customer, items, paymentMethod, notes } = req.body;

    // Validate customer
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    // Validate and prepare items
    let subtotal = 0;
    let totalCost = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: `Product ${item.product} not found`
        });
      }

      const lineTotal = item.quantity * item.unitPrice;
      const lineProfit = (item.unitPrice - product.costPrice) * item.quantity;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        unit: item.unit || product.unit || 'pcs',
        variation: item.variation || {},
        costPrice: product.costPrice,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        lineTotal,
        lineProfit
      });

      subtotal += lineTotal;
      totalCost += product.costPrice * item.quantity;
    }

    // Calculate totals
    const orderDiscount = req.body.discount || 0;
    const orderTax = req.body.tax || 0;
    const shippingCost = req.body.shippingCost || 0;
    const totalAmount = subtotal - orderDiscount + orderTax + shippingCost;
    const grossProfit = subtotal - totalCost - orderDiscount;
    const profitMargin = totalAmount > 0 ? (grossProfit / totalAmount) * 100 : 0;

    const orderNumber = await generateOrderNumber();

    const invoiceNumber = await generateInvoiceNumber(Invoice);
    const invoiceDate = new Date();

    const order = new Order({
      orderNumber,
      invoiceNumber,
      invoiceDate,
      customer,
      items: processedItems,
      paymentMethod,
      summary: {
        subtotal,
        discount: orderDiscount,
        tax: orderTax,
        shipping: shippingCost,
        totalAmount,
        totalCost,
        grossProfit,
        profitMargin
      },
      amountDue: totalAmount,
      dueDate: req.body.dueDate,
      notes,
      createdBy: req.user.id,
      status: 'confirmed'
    });

    await order.save();

    const invoice = new Invoice({
      invoiceNumber,
      order: order._id,
      customer,
      invoiceDate,
      dueDate: req.body.dueDate,
      billingAddress: req.body.billingAddress || {},
      items: processedItems.map((item) => ({
        product: item.product,
        description: item.variation?.notes || '',
        quantity: item.quantity,
        unit: item.unit,
        variation: item.variation,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        lineTotal: item.lineTotal
      })),
      summary: {
        subtotal,
        discount: orderDiscount,
        tax: orderTax,
        totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount
      },
      status: paymentMethod === 'cash' ? 'issued' : 'issued',
      notes,
      createdBy: req.user.id
    });

    await invoice.save();

    // Update customer credit used if payment method is credit
    if (paymentMethod === 'credit') {
      customerExists.creditUsed += totalAmount;
      customerExists.totalOutstanding += totalAmount;
      await customerExists.save();
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'confirmed', search, customer } = req.query;

    const query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('customer')
      .populate('items.product')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: orders,
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

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('createdBy', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Get payments for this order
    const payments = await Payment.find({ order: order._id });

    res.status(200).json({
      status: 'success',
      data: {
        order,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, deliveryStatus } = req.body;

    const allowedStatuses = ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order status'
      });
    }

    const updates = {};
    if (status) updates.status = status;
    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('customer').populate('items.product');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, referenceNumber } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (amount > order.amountDue) {
      return res.status(400).json({
        status: 'error',
        message: `Amount exceeds due amount (${order.amountDue})`
      });
    }

    const paymentNumber = `PAY-${Date.now()}`;

    const payment = new Payment({
      paymentNumber,
      order: orderId,
      customer: order.customer,
      amount,
      paymentMethod,
      referenceNumber,
      status: 'confirmed',
      approvedBy: req.user.id
    });

    await payment.save();

    // Update order
    order.amountPaid += amount;
    order.amountDue -= amount;

    if (order.amountDue === 0) {
      order.paymentStatus = 'paid';
    } else if (order.amountPaid > 0) {
      order.paymentStatus = 'partial';
    }

    await order.save();

    // Update invoice status based on the payment applied
    const invoice = await Invoice.findOne({ order: order._id });
    if (invoice) {
      invoice.summary.paidAmount += amount;
      invoice.summary.dueAmount = Math.max(0, invoice.summary.totalAmount - invoice.summary.paidAmount);
      invoice.status = invoice.summary.dueAmount === 0 ? 'paid' : invoice.status;
      await invoice.save();
    }

    // Update customer if credit transaction
    if (order.paymentMethod === 'credit') {
      const customer = await Customer.findById(order.customer);
      if (customer) {
        customer.creditUsed -= amount;
        customer.totalOutstanding -= amount;
        customer.lastPaymentDate = new Date();
        await customer.save();
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Payment recorded successfully',
      data: {
        payment,
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
