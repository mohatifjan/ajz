import express from 'express';
import { body } from 'express-validator';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  recordPurchasePayment,
  deletePurchaseOrder
} from '../controllers/purchaseOrderController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All purchase order routes require authentication
router.use(authenticateToken);

// Get all purchase orders
router.get('/', getPurchaseOrders);

// Get purchase order by ID
router.get('/:id', getPurchaseOrderById);

// Create purchase order
router.post(
  '/',
  [
    body('supplier').notEmpty().withMessage('Supplier is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').notEmpty().withMessage('Product is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.costPrice').isFloat({ min: 0 }).withMessage('Cost price must be non-negative')
  ],
  createPurchaseOrder
);

// Update purchase order status
router.patch('/:id/status', updatePurchaseOrderStatus);

// Record payment for purchase order
router.post('/:id/payment', recordPurchasePayment);

// Delete purchase order (Admin only)
router.delete('/:id', authorize('admin'), deletePurchaseOrder);

export default router;
