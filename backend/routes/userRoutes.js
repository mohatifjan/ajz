import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deactivateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get all users (Admin only)
router.get('/', authorize('admin'), getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Change password
router.put('/change-password', changePassword);

// Update user (Admin only)
router.put('/:id', authorize('admin'), updateUser);

// Deactivate user (Admin only)
router.patch('/:id/deactivate', authorize('admin'), deactivateUser);

// Delete user (Admin only)
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
