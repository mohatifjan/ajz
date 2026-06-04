import SystemConfig from '../models/SystemConfig.js';
import { logAudit } from './auditController.js';

/**
 * Get all system configurations.
 */
export const getConfigs = async (req, res, next) => {
    try {
        const configs = await SystemConfig.find().lean();
        res.status(200).json({
            status: 'success',
            data: configs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a specific configuration by key.
 */
export const getConfigByKey = async (req, res, next) => {
    try {
        const config = await SystemConfig.findOne({ key: req.params.key }).lean();
        if (!config) {
            return res.status(404).json({
                status: 'error',
                message: 'Configuration not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: config
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a configuration by key.
 */
export const updateConfig = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;

        let config = await SystemConfig.findOne({ key });

        const oldValues = config ? { value: config.value } : null;

        if (config) {
            config.value = value;
            if (description) config.description = description;
            config.updatedBy = req.user.id;
            await config.save();
        } else {
            config = new SystemConfig({
                key,
                value,
                description,
                updatedBy: req.user.id
            });
            await config.save();
        }

        // Audit Log
        await logAudit({
            user: req.user.id,
            userId: req.user.id,
            userEmail: req.user.email,
            action: 'SYSTEM_MANAGEMENT',
            entityType: 'System',
            entityId: config._id,
            entityName: key,
            oldValues,
            newValues: { value },
            description: `Updated system configuration: ${key}`,
            status: 'success',
            severity: 'medium'
        });

        res.status(200).json({
            status: 'success',
            data: config
        });
    } catch (error) {
        next(error);
    }
};
