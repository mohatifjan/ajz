import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'check', 'bank_transfer', 'upi', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    confirmationNumber: String,
    referenceNumber: String,
    chequeNumber: String,
    chequeDate: Date,
    bankName: String,
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundDetails: {
      refundAmount: Number,
      refundDate: Date,
      refundReason: String,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
