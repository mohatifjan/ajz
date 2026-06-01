import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
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
    phone: String,
    email: String,
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    openingDate: Date,
    notes: String
  },
  {
    timestamps: true
  }
);

branchSchema.index({ code: 1 });
branchSchema.index({ status: 1 });

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
