import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
  generateProductBarcode,
  generateQRCode,
  generateBulkBarcodes,
  scanBarcode,
  updateProductBarcode,
  getBarcodeStatistics
} from '../controllers/barcodeController.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Generate barcode for a product
router.get('/product/:productId/barcode', generateProductBarcode);

// Generate QR code for a product
router.get('/product/:productId/qrcode', generateQRCode);

// Generate barcodes for multiple products
router.post('/bulk', authorize('admin', 'manager'), [
  body('productIds').isArray({ min: 1 })
], generateBulkBarcodes);

// Scan a barcode (lookup product)
router.post('/scan', [
  body('barcode').notEmpty().trim()
], scanBarcode);

// Update product barcode
router.patch('/product/:productId/update', authorize('admin', 'manager'), [
  body('barcode').notEmpty().trim()
], updateProductBarcode);

// Get barcode statistics
router.get('/statistics', authorize('admin', 'manager'), getBarcodeStatistics);

export default router;
