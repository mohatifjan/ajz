import express from 'express';
import {
  getInvoices,
  getInvoiceByNumber,
  getInvoiceById,
  getInvoiceCustomers,
  getInvoiceOrders
} from '../controllers/invoiceController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getInvoices);
router.get('/id/:id', getInvoiceById);
router.get('/:invoiceNumber', getInvoiceByNumber);
router.get('/customers', getInvoiceCustomers);
router.get('/customer/:customerId/orders', getInvoiceOrders);

export default router;
