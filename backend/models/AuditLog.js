import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    userEmail: String,
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'CREATE',
        'UPDATE',
        'DELETE',
        'VIEW',
        'EXPORT',
        'IMPORT',
        'APPROVE',
        'REJECT',
        'RECONCILE',
        'PAYMENT_RECORDED',
        'ORDER_STATUS_CHANGE',
        'INVENTORY_ADJUSTMENT',
        'USER_MANAGEMENT'
      ],
      index: true
    },
    entityType: {
      type: String,
      enum: [
        'Product',
        'Customer',
        'Order',
        'Invoice',
        'Payment',
        'User',
        'Supplier',
        'PurchaseOrder',
        'Inventory',
        'Branch',
        'Category',
        'CustomerLedger',
        'Auth'
      ],
      required: true,
      index: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    entityName: String,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    changedFields: [String],
    description: String,
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success',
      index: true
    },
    errorMessage: String,
    metadata: mongoose.Schema.Types.Mixed,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
    indexes: [
      { user: 1, timestamp: -1 },
      { action: 1, timestamp: -1 },
      { entityType: 1, timestamp: -1 },
      { status: 1, timestamp: -1 },
      { severity: 1, timestamp: -1 },
      { userId: 1, timestamp: -1 }
    ]
  }
);

// Add text index for searching
auditLogSchema.index({
  description: 'text',
  entityName: 'text',
  userEmail: 'text'
});

export default mongoose.model('AuditLog', auditLogSchema);
