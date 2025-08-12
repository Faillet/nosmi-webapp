const mongoose = require('mongoose');
const User = require('../models/User');
const Ingredient = require('../models/Ingredient');
const Formula = require('../models/Formula');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nosmi-perfumery');
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const seedIngredients = async () => {
  const ingredients = [
    // Citrus
    {
      name: 'Bergamot',
      category: 'Citrus',
      notePosition: 'Top',
      intensity: 8.5,
      longevity: 2,
      sillage: 6,
      price: 45.0,
      origin: 'Italy (Calabria)',
      description: 'Fresh, bright, slightly floral with Earl Grey tea-like qualities',
      allergens: ['Limonene', 'Linalool'],
      safetyRating: 'A',
      volatility: 9,
      blendingTips: 'Excellent opener, pairs beautifully with lavender and rose'
    },
    {
      name: 'Lemon',
      category: 'Citrus',
      notePosition: 'Top',
      intensity: 9.0,
      longevity: 1,
      sillage: 7,
      price: 35.0,
      origin: 'Mediterranean',
      description: 'Sharp, zesty, clean and energizing',
      allergens: ['Limonene', 'Citral'],
      safetyRating: 'A',
      volatility: 10,
      blendingTips: 'Use sparingly, can overpower delicate notes'
    },
    
    // Floral
    {
      name: 'Rose de Mai',
      category: 'Floral',
      notePosition: 'Heart',
      intensity: 9.0,
      longevity: 6,
      sillage: 8,
      price: 450.0,
      origin: 'France (Grasse)',
      description: 'The queen of flowers, deep, velvety, romantic',
      allergens: ['Geraniol', 'Citronellol', 'Eugenol'],
      safetyRating: 'A',
      volatility: 4,
      blendingTips: 'Use sparingly, anchor with sandalwood'
    },
    {
      name: 'Jasmine Sambac',
      category: 'Floral',
      notePosition: 'Heart',
      intensity: 9.5,
      longevity: 8,
      sillage: 9,
      price: 380.0,
      origin: 'India',
      description: 'Intoxicating, narcotic, creamy white floral',
      allergens: ['Benzyl acetate', 'Linalool'],
      safetyRating: 'A',
      volatility: 3,
      blendingTips: 'Powerful, use in tiny amounts, beautiful with rose'
    },
    
    // Woody
    {
      name: 'Sandalwood',
      category: 'Woody',
      notePosition: 'Base',
      intensity: 8.0,
      longevity: 10,
      sillage: 6,
      price: 320.0,
      origin: 'Australia/India',
      description: 'Creamy, smooth, meditative and luxurious',
      allergens: [],
      safetyRating: 'A',
      volatility: 1,
      blendingTips: 'Perfect base note, enhances all florals'
    },
    {
      name: 'Cedar',
      category: 'Woody',
      notePosition: 'Base',
      intensity: 7.0,
      longevity: 8,
      sillage: 5,
      price: 45.0,
      origin: 'USA (Virginia)',
      description: 'Dry, pencil shavings, masculine and grounding',
      allergens: [],
      safetyRating: 'A',
      volatility: 2,
      blendingTips: 'Great masculine base, pairs with lavender'
    },
    
    // Oriental
    {
      name: 'Vanilla',
      category: 'Oriental',
      notePosition: 'Base',
      intensity: 7.0,
      longevity: 8,
      sillage: 6,
      price: 180.0,
      origin: 'Madagascar',
      description: 'Sweet, comforting, gourmand and universally loved',
      allergens: [],
      safetyRating: 'A',
      volatility: 2,
      blendingTips: 'Softens harsh notes, beautiful with woods'
    }
  ];

  for (const ingredientData of ingredients) {
    await Ingredient.findOneAndUpdate(
      { name: ingredientData.name },
      ingredientData,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✅ ${ingredients.length} ingrédients créés/mis à jour`);
};

const seedUsers = async () => {
  const userData = {
    username: 'demo_user',
    email: 'demo@nosmi.fr',
    password: 'demo123456',
    firstName: 'Demo',
    lastName: 'User'
  };

  const existingUser = await User.findOne({ email: userData.email });
  if (!existingUser) {
    const user = new User(userData);
    await user.save();
    console.log('✅ Utilisateur de démonstration créé');
    return user;
  } else {
    console.log('✅ Utilisateur de démonstration existe déjà');
    return existingUser;
  }
};

const seedFormulas = async (userId) => {
  const bergamot = await Ingredient.findOne({ name: 'Bergamot' });
  const rose = await Ingredient.findOne({ name: 'Rose de Mai' });
  const sandalwood = await Ingredient.findOne({ name: 'Sandalwood' });

  if (!bergamot || !rose || !sandalwood) {
    console.log('❌ Ingrédients manquants pour créer les formules');
    return;
  }

  const formulasData = [
    {
      name: 'Rose Élégante',
      category: 'Floral',
      concentration: 'Eau de Parfum',
      concept: 'Une rose moderne et sophistiquée',
      description: 'Un bouquet floral centré autour de la rose de Mai, adouci par le santal',
      volume: 50,
      creator: userId,
      batchNumber: 'NOS-20241201-0001',
      ingredients: [
        { ingredient: bergamot._id, percentage: 3.5, position: 'Top', notes: 'Ouverture pétillante' },
        { ingredient: rose._id, percentage: 15.0, position: 'Heart', notes: 'Cœur principal' },
        { ingredient: sandalwood._id, percentage: 8.0, position: 'Base', notes: 'Fond crémeux' }
      ],
      status: 'Draft',
      targetAudience: 'Feminine'
    },
    {
      name: 'Fresh Citrus',
      category: 'Citrus',
      concentration: 'Eau de Toilette',
      concept: 'Fraîcheur estivale',
      description: 'Un mélange énergisant et rafraîchissant pour l\'été',
      volume: 100,
      creator: userId,
      batchNumber: 'NOS-20241201-0002',
      ingredients: [
        { ingredient: bergamot._id, percentage: 8.0, position: 'Top', notes: 'Note dominante' }
      ],
      status: 'Testing',
      targetAudience: 'Unisex'
    }
  ];

  for (const formulaData of formulasData) {
    await Formula.findOneAndUpdate(
      { name: formulaData.name, creator: userId },
      formulaData,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✅ ${formulasData.length} formules créées/mises à jour`);
};

const runSeed = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Démarrage du seeding...');
    
    // Nettoyage optionnel (décommentez si besoin)
    // await User.deleteMany({});
    // await Ingredient.deleteMany({});
    // await Formula.deleteMany({});
    // console.log('🧹 Base de données nettoyée');
    
    await seedIngredients();
    const user = await seedUsers();
    await seedFormulas(user._id);
    
    console.log('🎉 Seeding terminé avec succès !');
    
    console.log('\n📋 Informations de connexion:');
    console.log('Email: demo@nosmi.fr');
    console.log('Mot de passe: demo123456');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
};

// Exécution si appelé directement
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
