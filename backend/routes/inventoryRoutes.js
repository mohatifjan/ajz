import express from 'express';
import {
  getInventoryMovements,
  getInventoryByProduct,
  approveMovement,
  getInventorySummary,
  createStockAudit,
  getStockAudits,
  approveStockAudit
} from '../controllers/inventoryController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All inventory routes require authentication
router.use(authenticateToken);

// Get inventory movements
router.get('/movements', getInventoryMovements);

// Get inventory audits
router.get('/audits', getStockAudits);
router.post('/audits', authorize('admin', 'manager'), createStockAudit);
router.patch('/audits/:id/approve', authorize('admin', 'manager'), approveStockAudit);

// Get inventory summary
router.get('/summary', getInventorySummary);

// Get inventory by product
router.get('/product/:productId', getInventoryByProduct);

// Approve movement (Manager/Admin only)
router.patch(
  '/movements/:id/approve',
  authorize('admin', 'manager'),
  approveMovement
);

export default router;
