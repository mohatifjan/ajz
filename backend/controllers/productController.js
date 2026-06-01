import Product from '../models/Product.js';
import Category from '../models/Category.js';
import InventoryMovement from '../models/InventoryMovement.js';
import { validationResult } from 'express-validator';

export const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { sku, name, category, costPrice, sellingPrice } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        status: 'error',
        message: 'Product with this SKU already exists'
      });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'active', search, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: products,
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

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'description', 'category', 'costPrice', 'sellingPrice',
      'wholesalePrice', 'retailPrice', 'unit', 'image', 'status', 'tax', 'discount'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { quantity, movementType, remarks } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const quantityBefore = product.stocks.totalStock;
    let quantityAfter = quantityBefore;

    if (movementType === 'inbound' || movementType === 'purchase') {
      quantityAfter = quantityBefore + quantity;
    } else if (movementType === 'outbound' || movementType === 'sales') {
      quantityAfter = quantityBefore - quantity;
    } else if (movementType === 'adjustment') {
      quantityAfter = quantity;
    }

    // Validate stock
    if (quantityAfter < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock'
      });
    }

    product.stocks.totalStock = quantityAfter;
    await product.save();

    // Log the inventory movement
    const movement = new InventoryMovement({
      product: product._id,
      movementType,
      quantity,
      quantityBefore,
      quantityAfter,
      reference: req.body.reference || `UPDATE-${Date.now()}`,
      remarks,
      recordedBy: req.user.id,
      status: 'approved'
    });

    await movement.save();

    res.status(200).json({
      status: 'success',
      message: 'Stock updated successfully',
      data: {
        product,
        movement
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stocks.totalStock', '$stocks.reorderLevel'] }
    })
      .populate('category')
      .sort({ 'stocks.totalStock': 1 });

    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
