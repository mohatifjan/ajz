import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
  exportSalesReport,
  exportProfitLossReport,
  exportCustomerOutstandingReport,
  exportInventoryValuationReport,
  exportInvoice
} from '../controllers/exportController.js';

const router = express.Router();

// All export routes require authentication and manager/admin role
router.use(authenticateToken);

// Sales Report Export
router.get('/sales-report', authorize('admin', 'manager'), exportSalesReport);

// Profit & Loss Report Export
router.get('/profit-loss-report', authorize('admin', 'manager'), exportProfitLossReport);

// Customer Outstanding Report Export
router.get('/customer-outstanding-report', authorize('admin', 'manager'), exportCustomerOutstandingReport);

// Inventory Valuation Report Export
router.get('/inventory-valuation-report', authorize('admin', 'manager'), exportInventoryValuationReport);

// Invoice Export
router.get('/invoice', authorize('admin', 'manager', 'staff'), exportInvoice);

export default router;
