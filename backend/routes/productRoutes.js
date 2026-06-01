import express from 'express';
import { body } from 'express-validator';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  getLowStockProducts,
  deleteProduct
} from '../controllers/productController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', getProducts);

// Get low stock products
router.get('/low-stock', getLowStockProducts);

// Get product by ID
router.get('/:id', getProductById);

// Create product (Admin only)
router.post(
  '/',
  authenticateToken,
  authorize('admin', 'manager'),
  [
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price is required'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price is required')
  ],
  createProduct
);

// Update product
router.put('/:id', authenticateToken, authorize('admin', 'manager'), updateProduct);

// Update stock
router.patch(
  '/:id/stock',
  authenticateToken,
  [
    body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
    body('movementType').notEmpty().withMessage('Movement type is required')
  ],
  updateStock
);

// Delete product (Admin only)
router.delete('/:id', authenticateToken, authorize('admin'), deleteProduct);

export default router;
