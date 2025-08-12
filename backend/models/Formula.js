const mongoose = require('mongoose');

const formulaIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: [true, 'Ingredient is required']
  },
  percentage: {
    type: Number,
    required: [true, 'Percentage is required'],
    min: [0.01, 'Percentage must be at least 0.01%'],
    max: [100, 'Percentage cannot exceed 100%']
  },
  position: {
    type: String,
    enum: ['Top', 'Heart', 'Base'],
    required: [true, 'Note position is required']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  }
});

const testResultSchema = new mongoose.Schema({
  testerName: {
    type: String,
    trim: true,
    maxlength: [50, 'Tester name cannot exceed 50 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating cannot exceed 10']
  },
  longevity: {
    type: Number,
    min: [1, 'Longevity rating must be at least 1'],
    max: [10, 'Longevity rating cannot exceed 10']
  },
  sillage: {
    type: Number,
    min: [1, 'Sillage rating must be at least 1'],
    max: [10, 'Sillage rating cannot exceed 10']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Test notes cannot exceed 500 characters']
  },
  testDate: {
    type: Date,
    default: Date.now
  },
  conditions: {
    temperature: Number,
    humidity: Number,
    skinType: {
      type: String,
      enum: ['Dry', 'Normal', 'Oily', 'Combination']
    }
  }
}, {
  timestamps: true
});

const formulaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Formula name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  batchNumber: {
    type: String,
    unique: true,
    required: [true, 'Batch number is required']
  },
  version: {
    type: String,
    default: '1.0',
    match: [/^\d+\.\d+$/, 'Version must be in format x.y']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  category: {
    type: String,
    enum: ['Citrus', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Aromatic', 'Chypre'],
    required: [true, 'Category is required']
  },
  concentration: {
    type: String,
    enum: ['Parfum', 'Eau de Parfum', 'Eau de Toilette', 'Eau de Cologne', 'Eau Fraiche'],
    default: 'Eau de Parfum'
  },
  concept: {
    type: String,
    trim: true,
    maxlength: [200, 'Concept cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  inspiration: {
    type: String,
    trim: true,
    maxlength: [300, 'Inspiration cannot exceed 300 characters']
  },
  targetAudience: {
    type: String,
    enum: ['Masculine', 'Feminine', 'Unisex'],
    default: 'Unisex'
  },
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'All Seasons'],
    default: 'All Seasons'
  },
  occasion: {
    type: String,
    enum: ['Daily', 'Evening', 'Special', 'Sport', 'Office'],
    default: 'Daily'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  volume: {
    type: Number,
    default: 50.0,
    min: [1, 'Volume must be at least 1ml'],
    max: [1000, 'Volume cannot exceed 1000ml']
  },
  totalConcentration: {
    type: Number,
    default: 0,
    min: [0, 'Total concentration cannot be negative'],
    max: [40, 'Total concentration cannot exceed 40%']
  },
  ingredients: [formulaIngredientSchema],
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative']
  },
  difficulty: {
    type: Number,
    min: [1, 'Difficulty must be at least 1'],
    max: [5, 'Difficulty cannot exceed 5'],
    default: 3
  },
  status: {
    type: String,
    enum: ['Draft', 'Testing', 'Approved', 'Production', 'Archived'],
    default: 'Draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  testResults: [testResultSchema],
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 10 },
    count: { type: Number, default: 0, min: 0 }
  },
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes pour performance
formulaSchema.index({ creator: 1 });
formulaSchema.index({ category: 1 });
formulaSchema.index({ status: 1 });
formulaSchema.index({ isPublic: 1 });
formulaSchema.index({ 'ratings.average': -1 });
formulaSchema.index({ createdAt: -1 });

// Virtual pour le nombre total d'ingrédients
formulaSchema.virtual('ingredientCount').get(function() {
  return this.ingredients.length;
});

// Méthode pour calculer le coût total
formulaSchema.methods.calculateTotalCost = function() {
  let totalCost = 0;
  this.ingredients.forEach(ing => {
    if (ing.ingredient && ing.ingredient.price) {
      const volume = (ing.percentage / 100) * this.volume;
      totalCost += (volume * ing.ingredient.price / 10); // Prix pour 10ml
    }
  });
  this.cost = totalCost;
  return totalCost;
};

// Méthode pour calculer la concentration totale
formulaSchema.methods.calculateTotalConcentration = function() {
  this.totalConcentration = this.ingredients.reduce((total, ing) => total + ing.percentage, 0);
  return this.totalConcentration;
};

// Méthode pour analyser l'équilibre
formulaSchema.methods.analyzeBalance = function() {
  let topNotes = 0, heartNotes = 0, baseNotes = 0;
  
  this.ingredients.forEach(ing => {
    switch (ing.position) {
      case 'Top': topNotes += ing.percentage; break;
      case 'Heart': heartNotes += ing.percentage; break;
      case 'Base': baseNotes += ing.percentage; break;
    }
  });
  
  const total = topNotes + heartNotes + baseNotes;
  return {
    topNotes: total > 0 ? (topNotes / total) * 100 : 0,
    heartNotes: total > 0 ? (heartNotes / total) * 100 : 0,
    baseNotes: total > 0 ? (baseNotes / total) * 100 : 0,
    totalConcentration: total,
    isBalanced: (topNotes/total >= 0.15 && topNotes/total <= 0.25) &&
                (heartNotes/total >= 0.45 && heartNotes/total <= 0.65) &&
                (baseNotes/total >= 0.20 && baseNotes/total <= 0.35)
  };
};

// Middleware pour mise à jour automatique
formulaSchema.pre('save', function(next) {
  this.lastModified = new Date();
  this.calculateTotalConcentration();
  next();
});

module.exports = mongoose.model('Formula', formulaSchema);
