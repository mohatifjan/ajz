import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
  getAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByEntity,
  deleteAuditLogs,
  getAuditStatistics
} from '../controllers/auditController.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all audit logs with filters
router.get('/', authorize('admin', 'manager'), getAuditLogs);

// Get audit statistics
router.get('/statistics', authorize('admin', 'manager'), getAuditStatistics);

// Get audit logs by user
router.get('/user/:userId', authorize('admin', 'manager'), getAuditLogsByUser);

// Get audit logs by entity type and optionally by entity ID
router.get('/:entityType/:entityId?', authorize('admin', 'manager'), getAuditLogsByEntity);

// Delete old audit logs (admin only)
router.post(
  '/cleanup',
  authorize('admin'),
  [body('olderThanDays').isInt({ min: 1 })],
  deleteAuditLogs
);

export default router;
