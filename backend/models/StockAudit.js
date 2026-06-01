import mongoose from 'mongoose';

const stockAuditSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    physicalCount: {
      type: Number,
      required: true,
      min: 0
    },
    systemCount: {
      type: Number,
      required: true,
      min: 0
    },
    discrepancy: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    remarks: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    auditDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

stockAuditSchema.index({ product: 1 });
stockAuditSchema.index({ status: 1 });

const StockAudit = mongoose.model('StockAudit', stockAuditSchema);

export default StockAudit;
