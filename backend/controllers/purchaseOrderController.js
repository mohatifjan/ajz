import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchasePayment from '../models/PurchasePayment.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import { validationResult } from 'express-validator';

const generatePurchaseOrderNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await PurchaseOrder.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    }
  });
  return `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { supplier, items, paymentMethod, notes } = req.body;

    // Validate supplier
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    // Validate and prepare items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: `Product ${item.product} not found`
        });
      }

      const lineTotal = item.quantity * item.costPrice;
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        unit: item.unit || product.unit || 'pcs',
        costPrice: item.costPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        lineTotal
      });

      subtotal += lineTotal;
    }

    // Calculate totals
    const orderDiscount = req.body.discount || 0;
    const orderTax = req.body.tax || 0;
    const shippingCost = req.body.shippingCost || 0;
    const totalAmount = subtotal - orderDiscount + orderTax + shippingCost;

    const purchaseOrderNumber = await generatePurchaseOrderNumber();

    const purchaseOrder = new PurchaseOrder({
      purchaseOrderNumber,
      supplier,
      items: processedItems,
      paymentMethod,
      summary: {
        subtotal,
        discount: orderDiscount,
        tax: orderTax,
        shipping: shippingCost,
        totalAmount
      },
      amountDue: totalAmount,
      dueDate: req.body.dueDate,
      notes,
      expectedDeliveryDate: req.body.expectedDeliveryDate,
      createdBy: req.user.id,
      status: 'ordered'
    });

    await purchaseOrder.save();

    // Update supplier credit used if payment method is credit
    if (paymentMethod === 'credit') {
      supplierExists.creditUsed += totalAmount;
      supplierExists.totalOutstanding += totalAmount;
      await supplierExists.save();
    }

    res.status(201).json({
      status: 'success',
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, supplier } = req.query;

    const query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;

    if (search) {
      query.purchaseOrderNumber = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier', 'companyName')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await PurchaseOrder.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: purchaseOrders,
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

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', 'firstName lastName');

    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase order not found'
      });
    }

    // Get payments for this purchase order
    const payments = await PurchasePayment.find({ purchaseOrder: purchaseOrder._id });

    res.status(200).json({
      status: 'success',
      data: {
        purchaseOrder,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status, deliveryStatus } = req.body;

    const allowedStatuses = ['draft', 'ordered', 'partial', 'received', 'paid', 'cancelled'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid purchase order status'
      });
    }

    const updates = {};
    if (status) updates.status = status;
    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;

    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('supplier').populate('items.product');

    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase order not found'
      });
    }

    // If status is received, update inventory
    if (status === 'received') {
      for (const item of purchaseOrder.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stocks.totalStock += item.quantity;
          await product.save();

          // Log inventory movement
          const movement = new InventoryMovement({
            product: product._id,
            movementType: 'purchase',
            quantity: item.quantity,
            quantityBefore: product.stocks.totalStock - item.quantity,
            quantityAfter: product.stocks.totalStock,
            reference: purchaseOrder.purchaseOrderNumber,
            remarks: `Purchase order received`,
            recordedBy: req.user.id,
            status: 'approved'
          });
          await movement.save();
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Purchase order updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

export const recordPurchasePayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, referenceNumber, notes } = req.body;
    const purchaseOrderId = req.params.id;

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase order not found'
      });
    }

    const paymentAmount = Number(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment amount'
      });
    }

    if (paymentAmount > purchaseOrder.amountDue) {
      return res.status(400).json({
        status: 'error',
        message: `Amount exceeds due amount (${purchaseOrder.amountDue})`
      });
    }

    const paymentNumber = `PPAY-${Date.now()}`;

    const payment = new PurchasePayment({
      paymentNumber,
      purchaseOrder: purchaseOrderId,
      supplier: purchaseOrder.supplier,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber,
      notes,
      status: 'confirmed',
      recordedBy: req.user.id
    });

    await payment.save();

    // Update purchase order
    purchaseOrder.amountDue = Math.max(0, purchaseOrder.amountDue - paymentAmount);

    if (purchaseOrder.amountDue === 0) {
      purchaseOrder.status = 'paid';
    } else if (purchaseOrder.amountDue > 0) {
      purchaseOrder.status = 'partial';
    }

    await purchaseOrder.save();

    // Update supplier if credit transaction
    if (purchaseOrder.paymentMethod === 'credit') {
      const supplier = await Supplier.findById(purchaseOrder.supplier);
      if (supplier) {
        supplier.creditUsed = Math.max(0, supplier.creditUsed - paymentAmount);
        supplier.totalOutstanding = Math.max(0, supplier.totalOutstanding - paymentAmount);
        supplier.lastPaymentDate = new Date();
        await supplier.save();
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Purchase payment recorded successfully',
      data: {
        payment,
        purchaseOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseOrder = async (req, res, next) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
