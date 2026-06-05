import mongoose from 'mongoose';

const customerLedgerSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    transactionType: {
      type: String,
      enum: ['sale', 'payment', 'credit_note', 'debit_note', 'adjustment'],
      required: true
    },
    transactionNumber: {
      type: String,
      required: true
    },
    reference: {
      order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
      },
      payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
      }
    },
    debit: {
      type: Number,
      default: 0,
      min: 0
    },
    credit: {
      type: Number,
      default: 0,
      min: 0
    },
    runningBalance: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    paymentDate: Date,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'written_off'],
      default: 'pending',
      index: true
    },
    agingBucket: {
      type: String,
      enum: ['current', '30_days', '60_days', '90_days', 'over_90'],
      default: 'current'
    },
    lastReconciled: Date,
    reconciled: {
      type: Boolean,
      default: false
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    indexes: [
      { customer: 1, transactionType: 1 },
      { customer: 1, dueDate: 1 },
      { customer: 1, status: 1 },
      { customer: 1, agingBucket: 1 },
      { transactionNumber: 1 }
    ]
  }
);

// Update running balance before saving
customerLedgerSchema.pre('save', async function(next) {
  if (this.isNew) {
    const previousEntry = await mongoose.model('CustomerLedger').findOne(
      { customer: this.customer },
      {},
      { sort: { createdAt: -1 } }
    );
    this.runningBalance = (previousEntry?.runningBalance || 0) + this.debit - this.credit;
  }
  next();
});

// Calculate aging bucket based on current date
export const calculateAgingBucket = (status, dueDate) => {
  if (status === 'paid') {
    return 'current';
  }

  const now = new Date();
  const daysOverdue = Math.floor((now - new Date(dueDate)) / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 0) {
    return 'current';
  } else if (daysOverdue <= 30) {
    return '30_days';
  } else if (daysOverdue <= 60) {
    return '60_days';
  } else if (daysOverdue <= 90) {
    return '90_days';
  } else {
    return 'over_90';
  }
};

customerLedgerSchema.methods.updateAgingBucket = function() {
  this.agingBucket = calculateAgingBucket(this.status, this.dueDate);
};

export default mongoose.model('CustomerLedger', customerLedgerSchema);
