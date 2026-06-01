import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    contactPerson: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
      }
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    gstNumber: String,
    panNumber: String,
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', '7_days', '15_days', '30_days', '45_days', '60_days'],
      default: '30_days'
    },
    creditUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOutstanding: {
      type: Number,
      default: 0,
      min: 0
    },
    accountStatus: {
      type: String,
      enum: ['good_standing', 'overdue', 'delinquent'],
      default: 'good_standing'
    },
    overdueDays: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPaymentDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    notes: String,
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    }
  },
  {
    timestamps: true
  }
);

supplierSchema.index({ email: 1 });
supplierSchema.index({ companyName: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ branch: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
