import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    description: String,
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
    unitPrice: {
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    invoiceDate: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    items: [invoiceItemSchema],
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
      totalAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      paidAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      dueAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'overdue'],
      default: 'issued'
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ order: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
