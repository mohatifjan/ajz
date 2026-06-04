import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
  getCustomerLedger,
  getAgingReport,
  getAllCustomersAgingReport,
  getCustomerStatement,
  reconcileLedger,
  createLedgerEntry,
  updateLedgerEntry
} from '../controllers/ledgerController.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get customer ledger with pagination
router.get('/customer/:customerId', getCustomerLedger);

// Get aging report for specific customer
router.get('/customer/:customerId/aging', getAgingReport);

// Get aging report for all customers
router.get('/aging/all', authorize('admin', 'manager'), getAllCustomersAgingReport);

// Get customer statement for export/view
router.get('/customer/:customerId/statement', getCustomerStatement);

// Download customer statement as PDF
router.get('/customer/:customerId/statement/download', getCustomerStatementPDF);

// Reconcile ledger entries
router.patch(
  '/customer/:customerId/reconcile',
  authorize('admin', 'manager'),
  [body('ledgerIds').isArray({ min: 1 })],
  reconcileLedger
);

// Create new ledger entry (manually)
router.post(
  '/customer/:customerId/entry',
  authorize('admin', 'manager'),
  [
    body('transactionType').isIn(['sale', 'payment', 'credit_note', 'debit_note', 'adjustment']),
    body('transactionNumber').notEmpty(),
    body('dueDate').isISO8601(),
    body('debit').isFloat({ min: 0 }),
    body('credit').isFloat({ min: 0 })
  ],
  createLedgerEntry
);

// Update ledger entry
router.patch(
  '/customer/:customerId/entry/:ledgerId',
  authorize('admin', 'manager'),
  updateLedgerEntry
);

export default router;
