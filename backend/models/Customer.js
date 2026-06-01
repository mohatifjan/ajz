import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerType: {
      type: String,
      enum: ['b2b', 'b2c', 'distributor', 'wholesaler'],
      default: 'b2b'
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    contactPerson: {
      firstName: {
        type: String,
        required: [true, 'Contact first name is required']
      },
      lastName: {
        type: String,
        required: [true, 'Contact last name is required']
      },
      designation: String
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    gstNumber: String,
    panNumber: String,
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    creditUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentTerms: {
      type: Number,
      default: 30,
      description: 'Payment days (e.g., 30, 60, 90)'
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Percentage discount'
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOutstanding: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked', 'suspended'],
      default: 'active'
    },
    accountStatus: {
      type: String,
      enum: ['good_standing', 'at_risk', 'overdue', 'delinquent'],
      default: 'good_standing'
    },
    overdueDays: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: [String],
    notes: String,
    lastOrderDate: Date,
    lastPaymentDate: Date,
    nextReviewDate: Date,
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ companyName: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ customerType: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ accountStatus: 1 });
customerSchema.index({ 'contactPerson.firstName': 1 });
customerSchema.index({ branch: 1 });

// Check if customer is overdue
customerSchema.methods.isOverdue = function() {
  return this.accountStatus === 'overdue' || this.accountStatus === 'delinquent';
};

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
