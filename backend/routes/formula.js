const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const formulaController = require('../controllers/formulaController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Validation schemas
const createFormulaValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la formule est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  
  body('category')
    .isIn(['Citrus', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Aromatic', 'Chypre'])
    .withMessage('Catégorie invalide'),
    
  body('concentration')
    .optional()
    .isIn(['Parfum', 'Eau de Parfum', 'Eau de Toilette', 'Eau de Cologne', 'Eau Fraiche'])
    .withMessage('Concentration invalide'),
    
  body('volume')
    .optional()
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Le volume doit être entre 1 et 1000ml'),
    
  body('ingredients')
    .optional()
    .isArray()
    .withMessage('Les ingrédients doivent être un tableau'),
    
  body('ingredients.*.ingredient')
    .optional()
    .isMongoId()
    .withMessage('ID d\'ingrédient invalide'),
    
  body('ingredients.*.percentage')
    .optional()
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Le pourcentage doit être entre 0.01 et 100'),
    
  body('ingredients.*.position')
    .optional()
    .isIn(['Top', 'Heart', 'Base'])
    .withMessage('Position de note invalide')
];

const updateFormulaValidation = [
  ...createFormulaValidation,
  body('status')
    .optional()
    .isIn(['Draft', 'Testing', 'Approved', 'Production', 'Archived'])
    .withMessage('Statut invalide')
];

const testResultValidation = [
  body('rating')
    .isInt({ min: 1, max: 10 })
    .withMessage('La note doit être entre 1 et 10'),
    
  body('longevity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('La tenue doit être entre 1 et 10'),
    
  body('sillage')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Le sillage doit être entre 1 et 10'),
    
  body('testerName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le nom du testeur ne peut pas dépasser 50 caractères'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les notes ne peuvent pas dépasser 500 caractères')
];

// Routes principales
router.get('/', authenticate, formulaController.getAllFormulas);
router.get('/:id', authenticate, formulaController.getFormulaById);
router.post('/', authenticate, createFormulaValidation, formulaController.createFormula);
router.put('/:id', authenticate, updateFormulaValidation, formulaController.updateFormula);
router.delete('/:id', authenticate, formulaController.deleteFormula);

// Routes spécifiques
router.post('/:id/test', authenticate, testResultValidation, formulaController.addTestResult);
router.get('/:id/analytics', authenticate, formulaController.getFormulaAnalytics);

// Upload d'images pour formule
router.post('/:id/images', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const formula = await Formula.findOne({ _id: id, creator: userId });
    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formule non trouvée'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }
    
    // Traitement des images (ici on simule, vous devriez uploader vers un service cloud)
    const newImages = req.files.map((file, index) => ({
      url: `/uploads/${file.filename}`,
      alt: `Image ${index + 1} de ${formula.name}`,
      isPrimary: index === 0 && formula.images.length === 0
    }));
    
    formula.images.push(...newImages);
    await formula.save();
    
    res.json({
      success: true,
      message: 'Images ajoutées avec succès',
      data: { images: newImages }
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des images'
    });
  }
});

module.exports = router;
