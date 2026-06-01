import AuditLog from '../models/AuditLog.js';

export const logAudit = async (auditData) => {
  try {
    const log = new AuditLog({
      ...auditData,
      timestamp: new Date()
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

export const auditLoggingMiddleware = (req, res, next) => {
  req.auditData = {
    user: req.user?.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  };

  const originalJson = res.json;
  res.json = function(data) {
    if (req.auditData) {
      req.auditData.status = res.statusCode >= 400 ? 'failed' : 'success';
      if (res.statusCode >= 400) {
        req.auditData.errorMessage = data?.message || 'Operation failed';
        req.auditData.severity = res.statusCode >= 500 ? 'high' : 'medium';
      }
      logAudit(req.auditData).catch(err => console.error('Audit logging error:', err));
    }
    return originalJson.call(this, data);
  };

  next();
};

export const createAuditLog = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(req.query.limit) || 20)
      .skip((parseInt(req.query.page) || 1 - 1) * (parseInt(req.query.limit) || 20))
      .populate('user', 'email name role')
      .lean();

    const total = await AuditLog.countDocuments();

    res.status(200).json({
      status: 'success',
      data: logs,
      pagination: {
        total,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        totalPages: Math.ceil(total / (parseInt(req.query.limit) || 20))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, userId, status, severity, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'email name role')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'email name role')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogsByEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { entityType };
    if (entityId) query.entityId = entityId;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'email name role')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAuditLogs = async (req, res, next) => {
  try {
    const { olderThanDays = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} audit logs older than ${olderThanDays} days`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditStatistics = async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $facet: {
          byAction: [
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byEntity: [
            { $group: { _id: '$entityType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          byUser: [
            { $group: { _id: '$userEmail', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          totalLogs: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};
