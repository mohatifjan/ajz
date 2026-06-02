import express from 'express';
import { body } from 'express-validator';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomerLedger,
  updateCustomer,
  getTopCustomers,
  getOverduePayments,
  deleteCustomer
} from '../controllers/customerController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, getCustomers);

// Get top customers
router.get('/analytics/top-customers', authenticateToken, getTopCustomers);

// Get overdue payments
router.get('/analytics/overdue-payments', authenticateToken, getOverduePayments);

// Get customer ledger
router.get('/:id/ledger', authenticateToken, getCustomerLedger);

// Get customer by ID
router.get('/:id', authenticateToken, getCustomerById);

// Create customer
router.post(
  '/',
  authenticateToken,
  authorize('admin', 'manager', 'customers'),
  [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('contactPerson.firstName').notEmpty().withMessage('Contact first name is required'),
    body('contactPerson.lastName').notEmpty().withMessage('Contact last name is required')
  ],
  createCustomer
);

// Update customer
router.put('/:id', authenticateToken, authorize('admin', 'manager', 'customers'), updateCustomer);

// Delete customer (Admin only)
router.delete('/:id', authenticateToken, authorize('admin', 'manager', 'customers'), deleteCustomer);

export default router;
