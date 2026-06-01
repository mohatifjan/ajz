import mongoose from 'mongoose';

const purchasePaymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'credit_card'],
      required: true
    },
    referenceNumber: String,
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'failed'],
      default: 'confirmed'
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    }
  },
  {
    timestamps: true
  }
);

purchasePaymentSchema.index({ paymentNumber: 1 });
purchasePaymentSchema.index({ purchaseOrder: 1 });
purchasePaymentSchema.index({ supplier: 1 });
purchasePaymentSchema.index({ branch: 1 });

const PurchasePayment = mongoose.model('PurchasePayment', purchasePaymentSchema);

export default PurchasePayment;
