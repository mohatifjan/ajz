import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { validationResult } from 'express-validator';

export const createSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { email } = req.body;

    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(400).json({
        status: 'error',
        message: 'Supplier with this email already exists'
      });
    }

    const supplier = new Supplier(req.body);
    await supplier.save();

    res.status(201).json({
      status: 'success',
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'active', search } = req.query;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const suppliers = await Supplier.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: suppliers,
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

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    // Get recent purchase orders
    const recentOrders = await PurchaseOrder.find({ supplier: supplier._id })
      .limit(10)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        supplier,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const allowedFields = [
      'companyName', 'contactPerson', 'email', 'phone', 'alternatePhone',
      'address', 'gstNumber', 'panNumber', 'creditLimit', 'paymentTerms',
      'status', 'notes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
