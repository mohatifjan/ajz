import express from 'express';
import { body } from 'express-validator';
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch
} from '../controllers/branchController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All branch routes require authentication
router.use(authenticateToken);

// Get all branches
router.get('/', getBranches);

// Get branch by ID
router.get('/:id', getBranchById);

// Create branch (Admin only)
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Branch name is required'),
    body('code').trim().notEmpty().withMessage('Branch code is required')
  ],
  createBranch
);

// Update branch (Admin only)
router.put('/:id', authorize('admin'), updateBranch);

// Delete branch (Admin only)
router.delete('/:id', authorize('admin'), deleteBranch);

export default router;
