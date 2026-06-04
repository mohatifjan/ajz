import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      default: 'pcs'
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseOrderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    },
    items: [purchaseOrderItemSchema],
    summary: {
      subtotal: {
        type: Number,
        default: 0,
        min: 0
      },
      discount: {
        type: Number,
        default: 0,
        min: 0
      },
      tax: {
        type: Number,
        default: 0,
        min: 0
      },
      shipping: {
        type: Number,
        default: 0,
        min: 0
      },
      totalAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    amountDue: {
      type: Number,
      default: 0,
      min: 0
    },
    dueDate: Date,
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit', 'bank_transfer', 'upi', 'cheque'],
      default: 'credit'
    },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'partial', 'received', 'paid', 'cancelled'],
      default: 'draft'
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'partial', 'delivered'],
      default: 'pending'
    },
    notes: String,
    expectedDeliveryDate: Date,
    createdBy: {
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

purchaseOrderSchema.index({ purchaseOrderNumber: 1 });
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ branch: 1 });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
