import express from 'express';
import { body } from 'express-validator';
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplierController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All supplier routes require authentication
router.use(authenticateToken);

// Get all suppliers
router.get('/', getSuppliers);

// Get supplier by ID
router.get('/:id', getSupplierById);

// Create supplier
router.post(
  '/',
  [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('contactPerson.firstName').notEmpty().withMessage('Contact first name is required'),
    body('contactPerson.lastName').notEmpty().withMessage('Contact last name is required')
  ],
  createSupplier
);

// Update supplier
router.put('/:id', updateSupplier);

// Delete supplier (Admin only)
router.delete('/:id', authorize('admin'), deleteSupplier);

export default router;
