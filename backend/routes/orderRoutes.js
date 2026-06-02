import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  recordPayment,
  deleteOrder
} from '../controllers/orderController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all orders
router.get('/', authenticateToken, getOrders);

// Get order by ID
router.get('/:id', authenticateToken, getOrderById);

// Create order
router.post(
  '/',
  authenticateToken,
  authorize('admin', 'manager', 'orders', 'invoices'),
  [
    body('customer').notEmpty().withMessage('Customer is required'),
    body('items').isArray().withMessage('Items must be an array'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
  ],
  createOrder
);

// Update order status
router.patch(
  '/:id/status',
  authenticateToken,
  authorize('admin', 'manager', 'orders', 'invoices'),
  updateOrderStatus
);

// Record payment
router.post(
  '/:id/payment',
  authenticateToken,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
  ],
  recordPayment
);

// Delete order (Admin only)
router.delete('/:id', authenticateToken, authorize('admin', 'manager', 'orders'), deleteOrder);

export default router;
