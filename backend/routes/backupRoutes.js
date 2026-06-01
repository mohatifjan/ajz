import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupStatus,
  scheduleBackup,
  exportDatabase
} from '../controllers/backupController.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create new backup (admin only)
router.post('/create', authorize('admin'), [
  body('backupName').optional().isString()
], createBackup);

// List all backups
router.get('/list', authorize('admin'), listBackups);

// Get backup status
router.get('/status', authorize('admin'), getBackupStatus);

// Restore from backup (admin only)
router.post('/restore', authorize('admin'), [
  body('backupName').notEmpty()
], restoreBackup);

// Delete backup (admin only)
router.delete('/:backupName', authorize('admin'), deleteBackup);

// Schedule automatic backups (admin only)
router.post('/schedule', authorize('admin'), [
  body('cronExpression').optional().isString()
], scheduleBackup);

// Export database as JSON
router.get('/export/json', authorize('admin'), exportDatabase);

export default router;
