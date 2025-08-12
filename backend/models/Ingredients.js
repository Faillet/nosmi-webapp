const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Citrus', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Aromatic', 'Chypre'],
  },
  notePosition: {
    type: String,
    required: [true, 'Note position is required'],
    enum: ['Top', 'Heart', 'Base']
  },
  intensity: {
    type: Number,
    required: [true, 'Intensity is required'],
    min: [0, 'Intensity cannot be negative'],
    max: [10, 'Intensity cannot exceed 10']
  },
  longevity: {
    type: Number,
    required: [true, 'Longevity is required'],
    min: [1, 'Longevity must be at least 1 hour'],
    max: [24, 'Longevity cannot exceed 24 hours']
  },
  sillage: {
    type: Number,
    required: [true, 'Sillage is required'],
    min: [1, 'Sillage must be at least 1'],
    max: [10, 'Sillage cannot exceed 10']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceUnit: {
    type: String,
    default: '10ml',
    enum: ['1ml', '5ml', '10ml', '50ml', '100ml']
  },
  origin: {
    type: String,
    trim: true,
    maxlength: [100, 'Origin cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  allergens: [{
    type: String,
    trim: true
  }],
  safetyRating: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    default: 'A'
  },
  volatility: {
    type: Number,
    min: [1, 'Volatility must be at least 1'],
    max: [10, 'Volatility cannot exceed 10'],
    default: 5
  },
  blendingTips: {
    type: String,
    trim: true,
    maxlength: [500, 'Blending tips cannot exceed 500 characters']
  },
  supplier: {
    type: String,
    trim: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  minimumStock: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  usage: {
    timesUsed: { type: Number, default: 0 },
    lastUsed: Date,
    popularityScore: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
ingredientSchema.index({ name: 1 });
ingredientSchema.index({ category: 1 });
ingredientSchema.index({ notePosition: 1 });
ingredientSchema.index({ price: 1 });

// Virtual for stock status
ingredientSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'Out of Stock';
  if (this.stockQuantity <= this.minimumStock) return 'Low Stock';
  return 'In Stock';
});

// Method to check if ingredient is low on stock
ingredientSchema.methods.isLowStock = function() {
  return this.stockQuantity <= this.minimumStock;
};

// Update usage statistics
ingredientSchema.methods.recordUsage = function() {
  this.usage.timesUsed += 1;
  this.usage.lastUsed = new Date();
  this.usage.popularityScore = this.usage.timesUsed * 0.1 + (this.intensity || 0) * 0.05;
  return this.save();
};

module.exports = mongoose.model('Ingredient', ingredientSchema);
