import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
