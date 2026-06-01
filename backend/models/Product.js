import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    wholesalePrice: {
      type: Number,
      min: [0, 'Wholesale price cannot be negative']
    },
    retailPrice: {
      type: Number,
      min: [0, 'Retail price cannot be negative']
    },
    unit: {
      type: String,
      enum: ['pcs', 'box', 'carton', 'kg', 'liter', 'meter'],
      default: 'pcs'
    },
    stocks: {
      totalStock: {
        type: Number,
        default: 0,
        min: 0
      },
      reorderLevel: {
        type: Number,
        default: 10,
        min: 0
      },
      reorderQuantity: {
        type: Number,
        default: 50,
        min: 1
      },
      warehouseLocation: String
    },
    supplier: {
      name: String,
      contactPerson: String,
      email: String,
      phone: String
    },
    image: String,
    images: [String],
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active'
    },
    barcode: String,
    tax: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    pricingTiers: [
      {
        tierName: String,
        minQuantity: Number,
        price: Number,
        discount: Number
      }
    ],
    variations: [
      {
        sku: String,
        size: String,
        material: String,
        unit: { type: String, default: 'pcs' },
        costPrice: Number,
        sellingPrice: Number,
        wholesalePrice: Number,
        stockAdjustment: Number
      }
    ],
    tags: [String],
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Calculate profit margin
productSchema.methods.profitMargin = function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
};

// Check if stock is low
productSchema.methods.isLowStock = function() {
  return this.stocks.totalStock <= this.stocks.reorderLevel;
};

// Indexes for common queries
productSchema.index({ sku: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'stocks.totalStock': 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ branch: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
