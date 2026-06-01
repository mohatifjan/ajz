import InventoryMovement from '../models/InventoryMovement.js';
import Product from '../models/Product.js';
import StockAudit from '../models/StockAudit.js';

export const getInventoryMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, movementType, status, product } = req.query;

    const query = {};
    if (movementType) query.movementType = movementType;
    if (status) query.status = status;
    if (product) query.product = product;

    const skip = (page - 1) * limit;

    const movements = await InventoryMovement.find(query)
      .populate('product', 'name sku')
      .populate('recordedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await InventoryMovement.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: movements,
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

export const getInventoryByProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const movements = await InventoryMovement.find({ product: req.params.productId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      data: {
        product,
        movements
      }
    });
  } catch (error) {
    next(error);
  }
};

export const approveMovement = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    const movement = await InventoryMovement.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: req.user.id
      },
      { new: true }
    ).populate('product').populate('recordedBy', 'firstName lastName');

    if (!movement) {
      return res.status(404).json({
        status: 'error',
        message: 'Movement not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Movement ${status} successfully`,
      data: movement
    });
  } catch (error) {
    next(error);
  }
};

export const getInventorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$stocks.totalStock' },
          totalValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$costPrice'] }
          },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: ['$stocks.totalStock', '$stocks.reorderLevel'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: summary[0] || {}
    });
  } catch (error) {
    next(error);
  }
};

export const createStockAudit = async (req, res, next) => {
  try {
    const { productId, physicalCount, remarks } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const systemCount = product.stocks?.totalStock || 0;
    const discrepancy = physicalCount - systemCount;

    const audit = new StockAudit({
      product: productId,
      physicalCount,
      systemCount,
      discrepancy,
      remarks,
      recordedBy: req.user.id
    });

    await audit.save();

    res.status(201).json({
      status: 'success',
      message: 'Stock audit created successfully',
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

export const getStockAudits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, product } = req.query;
    const query = {};
    if (status) query.status = status;
    if (product) query.product = product;

    const skip = (page - 1) * limit;

    const audits = await StockAudit.find(query)
      .populate('product', 'name sku')
      .populate('recordedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await StockAudit.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: audits,
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

export const approveStockAudit = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    const audit = await StockAudit.findById(req.params.id).populate('product');

    if (!audit) {
      return res.status(404).json({
        status: 'error',
        message: 'Stock audit not found'
      });
    }

    audit.status = status;
    audit.approvedBy = req.user.id;
    audit.approvedAt = new Date();

    if (status === 'approved') {
      const product = await Product.findById(audit.product._id);
      product.stocks = product.stocks || {};
      product.stocks.totalStock = audit.physicalCount;
      await product.save();

      const movement = new InventoryMovement({
        product: product._id,
        movementType: 'adjustment',
        quantity: audit.discrepancy,
        quantityBefore: audit.systemCount,
        quantityAfter: audit.physicalCount,
        reference: `AUDIT-${audit._id}`,
        remarks: `Stock audit adjustment: ${audit.remarks || 'no remarks'}`,
        recordedBy: req.user.id,
        approvedBy: req.user.id,
        status: 'approved'
      });
      await movement.save();
    }

    await audit.save();

    res.status(200).json({
      status: 'success',
      message: `Stock audit ${status} successfully`,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};
