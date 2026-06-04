import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

export const getInvoices = async (req, res, next) => {
  try {
    const { search, customerId, status } = req.query;
    const filter = {};

    if (customerId) {
      filter.customer = customerId;
    }
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.invoiceNumber = new RegExp(search, 'i');
    }

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name phone email')
      .populate('order', 'orderNumber')
      .populate('items.product', 'name sku')
      .sort({ invoiceDate: -1 });

    res.status(200).json({ status: 'success', data: invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceByNumber = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('customer', 'name phone email address')
      .populate('order', 'orderNumber totalAmount')
      .populate('items.product', 'name sku');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('order', 'orderNumber totalAmount')
      .populate('items.product', 'name sku');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({}).select('name email phone');
    res.status(200).json({ status: 'success', data: customers });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.params.customerId }).select('orderNumber totalAmount amountDue');
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    next(error);
  }
};
