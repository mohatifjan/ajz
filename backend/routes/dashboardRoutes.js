import express from 'express';
import {
  getDashboardSummary,
  getSalesOverview,
  getRevenueMetrics,
  getCustomerIntelligence,
  getInventoryOverview,
  getSalesAnalytics,
  getSalesReports,
  getProfitLossReport,
  getCustomerOutstandingReports,
  getInventoryValuationReports
} from '../controllers/dashboardController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication and admin/manager role
router.use(authenticateToken, authorize('admin', 'manager'));

// Main dashboard summary
router.get('/summary', getDashboardSummary);

// Sales overview (daily, weekly, monthly)
router.get('/sales-overview', getSalesOverview);

// Revenue metrics
router.get('/revenue', getRevenueMetrics);

// Customer intelligence
router.get('/customers', getCustomerIntelligence);

// Inventory overview
router.get('/inventory', getInventoryOverview);

// Sales analytics
router.get('/analytics', getSalesAnalytics);

// Reports
router.get('/reports/sales', getSalesReports);
router.get('/reports/profit-loss', getProfitLossReport);
router.get('/reports/customer-outstanding', getCustomerOutstandingReports);
router.get('/reports/inventory-valuation', getInventoryValuationReports);

export default router;

