import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    invoiceDate: Date,
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required']
    },
    orderType: {
      type: String,
      enum: ['sales', 'purchase', 'return', 'exchange'],
      default: 'sales'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'check', 'bank_transfer', 'credit', 'upi'],
      default: 'cash'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'failed', 'cancelled'],
      default: 'pending'
    },
    items: [
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
        variation: {
          size: String,
          material: String,
          notes: String
        },
        costPrice: Number,
        unitPrice: Number,
        discount: {
          type: Number,
          default: 0
        },
        tax: {
          type: Number,
          default: 0
        },
        lineTotal: Number,
        lineProfit: Number
      }
    ],
    summary: {
      subtotal: {
        type: Number,
        default: 0
      },
      discount: {
        type: Number,
        default: 0
      },
      tax: {
        type: Number,
        default: 0
      },
      shipping: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        default: 0
      },
      totalCost: {
        type: Number,
        default: 0
      },
      grossProfit: {
        type: Number,
        default: 0
      },
      profitMargin: {
        type: Number,
        default: 0
      }
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    amountDue: {
      type: Number,
      default: 0
    },
    dueDate: Date,
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'dispatched', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending'
    },
    deliveryDate: Date,
    notes: String,
    internalNotes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'draft'
    },
    referenceNumber: String,
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ branch: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ dueDate: 1 });

// Virtual for payment status calculation
orderSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.paymentStatus !== 'paid';
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
