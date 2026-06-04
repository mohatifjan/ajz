import express from 'express';
import { getConfigs, getConfigByKey, updateConfig } from '../controllers/configController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All config routes are protected and restricted to admins
router.use(authenticateToken);
router.use(authorize('admin'));

router.get('/', getConfigs);
router.get('/:key', getConfigByKey);
router.post('/:key', updateConfig);
router.put('/:key', updateConfig);

export default router;
