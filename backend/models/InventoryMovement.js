import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    movementType: {
      type: String,
      enum: ['purchase', 'sales', 'return', 'adjustment', 'damage', 'stock_transfer'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    quantityBefore: Number,
    quantityAfter: Number,
    reference: {
      type: String,
      required: true,
      description: 'Order number or reference'
    },
    location: String,
    remarks: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    photo: String
  },
  {
    timestamps: true
  }
);

inventoryMovementSchema.index({ product: 1 });
inventoryMovementSchema.index({ movementType: 1 });
inventoryMovementSchema.index({ createdAt: -1 });
inventoryMovementSchema.index({ 'reference': 1 });

const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);

export default InventoryMovement;
